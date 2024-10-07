import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';
import Select from 'react-select';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [tagInputs, setTagInputs] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [uniqueTags, setUniqueTags] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadUsersFromIDB = async () => {
      const db = await openDB('twitterDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('users')) {
            const store = db.createObjectStore('users', { keyPath: 'id' });
            store.createIndex('sequence', 'sequence');
          }
        },
      });

      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');
      const index = store.index('sequence');
      const allUsers = await index.getAll();

      if (allUsers.length > 0) {
        setUsers(allUsers);
      }
    };

    loadUsersFromIDB();
  }, []);

  useEffect(() => {
    const tags = new Set();
    users.forEach(user => {
      user.tags?.forEach(tag => tags.add(tag));
    });
    setUniqueTags([...tags]);
  }, [users]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
  
        console.log('Uploaded JSON data:', jsonData);
  
        if (Array.isArray(jsonData)) {
          const userTagsMap = users.reduce((acc, user) => {
            acc[user.id] = user.tags || [];
            return acc;
          }, {});
  
          const updatedUsers = jsonData.map(user => {
            const existingTags = userTagsMap[user.id] || [];
            return {
              ...user,
              tags: user.tags ? [...existingTags, ...user.tags] : existingTags,
            };
          });
  
          setUsers(updatedUsers);
          await saveUsersToIDB(updatedUsers);
        } else {
          console.warn('JSON data is not an array:', jsonData);
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };
  
    if (file) {
      reader.readAsText(file);
    }
  };

  const saveUsersToIDB = async (usersData) => {
    const db = await openDB('twitterDB', 1);
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');

    await store.clear();

    usersData.forEach((user, index) => {
      user.sequence = index;
      user.tags = user.tags || [];
      store.put(user);
    });

    await tx.done;
  };

  const handleTagInputChange = (e, userId) => {
    setTagInputs((prev) => ({
      ...prev,
      [userId]: e.target.value,
    }));
  };

  const addTag = async (userId) => {
    const newTag = tagInputs[userId]?.trim();
    if (newTag) {
      const updatedUsers = users.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            tags: [...(user.tags || []), newTag],
          };
        }
        return user;
      });
      setUsers(updatedUsers);
      await saveUsersToIDB(updatedUsers);
      setTagInputs((prev) => ({
        ...prev,
        [userId]: '',
      }));
    }
  };

  // Add functionality to submit tag with Enter key
  const handleKeyPress = (e, userId) => {
    if (e.key === 'Enter') {
      addTag(userId);
    }
  };

  const removeTag = async (userId, tagToRemove) => {
    const updatedUsers = users.map((user) => {
      if (user.id === userId) {
        return {
          ...user,
          tags: user.tags.filter(tag => tag !== tagToRemove),
        };
      }
      return user;
    });
    setUsers(updatedUsers);
    await saveUsersToIDB(updatedUsers);
  };

  const openModal = (images, index) => {
    setSelectedImages(images);
    setCurrentImageIndex(index);
    setIsModalOpen(true);
    document.addEventListener('keydown', handleKeyDown); // Add keydown event listener
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
    document.removeEventListener('keydown', handleKeyDown); // Clean up the listener
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % selectedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + selectedImages.length) % selectedImages.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    }
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'users_data.json';
    link.click();

    URL.revokeObjectURL(url);
  };

  const filteredUsers = selectedTags.length > 0
    ? users.filter(user => user.tags.some(tag => selectedTags.map(t => t.value).includes(tag)))
    : users;

  const tagOptions = uniqueTags.map(tag => ({ value: tag, label: tag }));

  return (
    <>
      <div className="header">
        <h1>Twitter User Feed</h1>
        <p className="post-count">Total Posts: {filteredUsers.length}</p>
        <input type="file" accept=".json" onChange={handleFileUpload} />
        <button onClick={downloadJSON}>Download JSON</button>
        <div className="tag-filter-container">
          <label htmlFor="tag-filter">Filter by Tags: </label>
          <Select
            isMulti
            options={tagOptions}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={setSelectedTags}
            closeMenuOnSelect={false}
            placeholder="Select tags..."
            styles={{
              control: (provided) => ({
                ...provided,
                width: '250px',
                backgroundColor: '#333',
                border: '1px solid #555',
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: '#333',
                color: '#fff',
                width: '250px',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused ? '#1DA1F2' : '#333',
                color: state.isFocused ? '#fff' : '#fff',
              }),
            }}
          />
        </div>
      </div>
      <div className="container">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div className="user-card" key={user.id}>
              <h2>
                <a
                  href={`https://twitter.com/${user.screen_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1DA1F2', textDecoration: 'none' }}
                >
                  {user.screen_name}
                </a>
              </h2>
              <p>{user.full_text}</p>
              <a
                href={user.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1DA1F2', textDecoration: 'underline' }}
              >
                View Original Tweet
              </a>

              <div className="tags">
                {user.tags && user.tags.length > 0 ? (
                  user.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button className="delete-button" onClick={() => removeTag(user.id, tag)}>x</button>
                    </span>
                  ))
                ) : (
                  <p>No tags added yet.</p>
                )}
              </div>

              <div className="add-tag">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  value={tagInputs[user.id] || ''}
                  onChange={(e) => handleTagInputChange(e, user.id)}
                  onKeyPress={(e) => handleKeyPress(e, user.id)} // Handle Enter key press
                />
                <button onClick={() => addTag(user.id)}>Add Tag</button>
              </div>

              {user.media && user.media.length > 0 && (
                <div className="user-media">
                  <h3>Media:</h3>
                  <ul>
                    {user.media.map((mediaItem, index) => (
                      <li key={index}>
                        {mediaItem.type === 'video' ||
                          mediaItem.type === 'animated_gif' ? (
                          <video
                            controls
                            style={{ cursor: 'pointer', width: '100%' }}
                            onClick={() => openModal(user.media, index)}
                          >
                            <source
                              src={mediaItem.original}
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={mediaItem.original}
                            alt="Media"
                            onClick={() => openModal(user.media, index)}
                            style={{ cursor: 'pointer' }}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <span className="arrow left-arrow" onClick={prevImage}>&lt;</span>
            <img className="modal-image" src={selectedImages[currentImageIndex]?.original} alt="Selected" />
            <span className="arrow right-arrow" onClick={nextImage}>&gt;</span>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
