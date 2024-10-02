import React, { useState } from 'react'; // Remove useEffect
import './App.css';

function App() {
  const [users, setUsers] = useState([]); // Initialize users as an empty array
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]; // Get the uploaded file
    console.log("File selected:", file); // Log the selected file

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result); // Parse JSON data
        console.log("Parsed JSON data:", jsonData); // Log parsed JSON data

        // Set users state with the parsed data
        if (Array.isArray(jsonData)) {
          setUsers(jsonData); // Set users state directly from JSON
        } else {
          console.warn("JSON data is not an array:", jsonData);
        }

        console.log("Data loaded:", jsonData); // Log loaded data
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    if (file) {
      reader.readAsText(file); // Read the file as text
    } else {
      console.log("No file selected."); // Log if no file is selected
    }
  };

  const openModal = (images, index) => {
    setSelectedImages(images);
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      (prevIndex + 1) % selectedImages.length
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      (prevIndex - 1 + selectedImages.length) % selectedImages.length
    );
  };

  return (
    <>
      <div className="header">
        <h1>Twitter User Feed</h1>
        <p className="post-count">Total Posts: {users.length}</p>
        <input type="file" accept=".json" onChange={handleFileUpload} /> {/* File upload input */}
      </div>
      <div className="container">
        {users.length > 0 ? (
          users.map((user) => (
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
              {user.media && user.media.length > 0 && (
                <div className="user-media">
                  <h3>Media:</h3>
                  <ul>
                    {user.media.map((mediaItem, index) => (
                      <li key={index}>
                        {mediaItem.type === 'video' || mediaItem.type === 'animated_gif' ? (
                          <video
                            controls
                            style={{ cursor: 'pointer', width: '100%' }}
                            onClick={() => openModal(user.media, index)}
                          >
                            <source src={mediaItem.original} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={mediaItem.original}
                            alt={`Image for ${user.screen_name}`}
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
          <div>No users found.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          {selectedImages.length > 1 && (
            <span className="arrow left-arrow" onClick={(e) => { e.stopPropagation(); prevImage(); }}>&lt;</span>
          )}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {selectedImages[currentImageIndex].type === 'video' ? (
              <video controls className="modal-image">
                <source src={selectedImages[currentImageIndex].original} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={selectedImages[currentImageIndex].original}
                alt="Enlarged"
                className="modal-image"
              />
            )}
          </div>
          {selectedImages.length > 1 && (
            <span className="arrow right-arrow" onClick={(e) => { e.stopPropagation(); nextImage(); }}>&gt;</span>
          )}
          <span className="close" onClick={closeModal}>&times;</span>
        </div>
      )}
    </>
  );
}

export default App;
