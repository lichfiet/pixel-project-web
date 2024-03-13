import { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_SERVER_URL}/`); // Replace with your server URL

function App() {
  const [selected, setSelected] = useState("0, 0");
  const [pixels, setPixels] = useState([]);
  const [currColor, setCurrColor] = useState('#000000');

  const board = async (data) => {

    let boardInfo = []

    if (data === undefined) {
      boardInfo = (await axios.get(`${import.meta.env.VITE_SERVER_URL}/getCanvas`)).data;
    } else {
      boardInfo = data
    }

    try {
      console.log(4)
      const drawnPixels = await boardInfo.map(
        (color, index) => (
          { coords: `${Math.ceil((index + 1) / 50)}, ${(index + 1) - (Math.ceil((index + 1) / 50) - 1) * 50}`, color, index, }
        )
      );
      
      setPixels(drawnPixels);
    } catch (error) {
      console.error("Error fetching canvas data:", error);
    }
  };

  useEffect(() => {
    // Connect to socket in "index.html"
    socket.connect();

    // Turn on a listener for "pixel-update"
    socket.on('pixel-update', ({ data }) => {
      // Update the color on your side
      setPixels((prevPixels) => {
        const updatedPixels = [...prevPixels];
        const clickedPixelIndex = updatedPixels.findIndex((pixel) => pixel.index === data.index);

        if (clickedPixelIndex !== -1) {
          updatedPixels[clickedPixelIndex].color = data.color;
        }

        return updatedPixels;
      });
    });

    socket.on('canvas-reset', ({ data }) => {
      board(data.canvas);
      console.log("Canvas wiped by user");
    });

    board();

    // On component unmount, turn off the listener for "test-event"
    return () => {
      socket.off('pixel-update');
      socket.off('canvas-reset');
      socket.disconnect();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const handleColorChange = (event) => {
    setCurrColor(event.target.value);
  };

  const handlePixelClick = (coords, index) => {
    // Update the color on your side
    setPixels((prevPixels) => {
      const updatedPixels = [...prevPixels];
      const clickedPixelIndex = updatedPixels.findIndex((pixel) => pixel.index === index);

      if (clickedPixelIndex !== -1) {
        updatedPixels[clickedPixelIndex].color = currColor;
      }

      return updatedPixels;
    });

    // Emit event to server to update other clients
    socket.emit('pixel-update', { data: { coords, color: currColor, index } });
  };

  return (
    <>
      <div>
        <div className="basic-grid">
          {pixels.map((meow) => (
            <div
              className={`card`}
              style={{ backgroundColor: meow.color }}
              key={meow.coords}
              index={meow.index}
              onMouseOver={() => {
                setSelected(meow.coords + ' ' + meow.color + ' ' + meow.index);
              }}
              onClick={() => handlePixelClick(meow.coords, meow.index)}
            ></div>
          ))}
        </div>
        <h1 className='h1'>{selected}</h1>
        {/* Wipe Canvas Button */}
        <button onClick={() => socket.emit('canvas-reset', { data: 'I wiped my canvas' })}> Wipe Canvas </button>
        <div>
          <label htmlFor="head">Current Color</label>
          <input type="color" id="head" onBlur={handleColorChange}/>
        </div>
      </div>



    </>
  );
}

export default App;