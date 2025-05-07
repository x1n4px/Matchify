import React, { useState, useEffect, useRef } from 'react';

// Helper function to shuffle an array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
};

// Card Component - Now accepts a ref
const Card = React.forwardRef(({ displayValue, isMatched, isSelected, onClick }, ref) => {
  return (
    // Apply different styles based on state using Tailwind CSS classes
    <div
      ref={ref} // Attach the ref to the div element
      // Disable clicks if already matched
      onClick={isMatched ? null : onClick}
      className={`
        w-48 h-64 flex items-center justify-center m-3 // Increased size and margin
        rounded-lg cursor-pointer text-xl font-bold text-center p-2 
        transition-all duration-300 ease-in-out
        ${isMatched
          ? 'bg-green-500 text-white cursor-not-allowed' // Estilo para tarjetas emparejadas
          : isSelected
            ? 'bg-yellow-400 text-gray-800' // Estilo para tarjetas seleccionadas
            : 'bg-blue-500 text-white hover:bg-blue-600' // Estilo por defecto
        }
      `}
    >
      {/* Siempre muestra el valor de visualización */}
      {displayValue}
    </div>
  );
});

// Modal Component - Now receives incorrectAttempts
const Modal = ({ score, totalPairs, incorrectAttempts, onClose }) => {
  // Determine the message based on the score and attempts
  let message = '';
  if (score === totalPairs) {
    message = incorrectAttempts === 0 ?
      '¡Excelente! ¡Has acertado todas las parejas al primer intento! ¡Perfecto!' :
      `¡Excelente! ¡Has acertado todas las parejas! Tuviste ${incorrectAttempts} intentos fallidos.`;
  } else {
    message = `¡Bien hecho! Has acertado ${score} de ${totalPairs} parejas. Tuviste ${incorrectAttempts} intentos fallidos.`;
  }


  return (
    // Modal overlay
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal content */}
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Juego Terminado</h2>
        <p className="text-lg mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};


// Main App Component
const App = () => {
  // Define the predefined matching pairs
  // Each object represents a pair linked by the 'key'
  const matchingPairsData = [
    { key: 'A', valueRow1: 'Sócrates', valueRow2: 'Conócete a ti mismo” y método mayéutico' },
    { key: 'B', valueRow1: 'Platón', valueRow2: 'Teoría de las Ideas: el mundo sensible y el mundo inteligible' },
    { key: 'C', valueRow1: 'Aristóteles', valueRow2: 'La virtud como hábito y el término medio' },
    { key: 'D', valueRow1: 'Racionalismo', valueRow2: 'Corriente filosófica que defiende que el conocimiento proviene de la razón (Descartes)' },
    { key: 'E', valueRow1: 'Empirismo', valueRow2: 'Doctrina que sostiene que el conocimiento se origina en la experiencia sensorial (Locke, Hume)' },
  ];

  // Function to create initial card states
  const createInitialCards = () => {
      const initialRow1 = matchingPairsData.map((pair, index) => ({
        id: `row1-${index}`,
        key: pair.key, // This is the key used for matching
        displayValue: pair.valueRow1, // This is the value displayed in row 1
        isMatched: false,
      }));

      const shuffledPairs = shuffleArray([...matchingPairsData]);
      const initialRow2 = shuffledPairs.map((pair, index) => ({
        id: `row2-${index}`,
        key: pair.key, // This is the key used for matching
        displayValue: pair.valueRow2, // This is the value displayed in row 2
        isMatched: false,
      }));

      return { initialRow1, initialRow2 };
  };

  // State for the cards in each row
  const { initialRow1, initialRow2 } = createInitialCards();
  const [row1Cards, setRow1Cards] = useState(initialRow1);
  const [row2Cards, setRow2Cards] = useState(initialRow2);

  // State to keep track of selected cards
  const [selectedCards, setSelectedCards] = useState([]); // Can hold up to 2 card objects

  // State to prevent clicking during the matching check delay
  const [isChecking, setIsChecking] = useState(false);

  // State to store matched pairs (ids of the two cards)
  const [matchedPairs, setMatchedPairs] = useState([]); // Array of [id1, id2] pairs

  // State to store the coordinates for drawing lines
  const [lineCoordinates, setLineCoordinates] = useState([]); // Array of { x1, y1, x2, y2 }

  // State for the score (correct attempts)
  const [score, setScore] = useState(0);

  // State for incorrect attempts
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);

  // State to control modal visibility
  const [showModal, setShowModal] = useState(false);

  // Refs to store DOM elements of the cards
  const cardRefs = useRef({});

  // Ref for the main container to calculate relative positions
  const containerRef = useRef(null);

  // Effect to check for matches when two cards are selected
  useEffect(() => {
    if (selectedCards.length === 2) {
      setIsChecking(true); // Prevent further clicks

      const [card1, card2] = selectedCards;

      // Check if the keys match and they are from different rows
      if (card1.key === card2.key && card1.id.split('-')[0] !== card2.id.split('-')[0]) {
        // Match found! Update the isMatched state for both cards
        setRow1Cards(prevCards =>
          prevCards.map(card =>
            card.id === card1.id || card.id === card2.id ? { ...card, isMatched: true } : card
          )
        );
        setRow2Cards(prevCards =>
          prevCards.map(card =>
            card.id === card1.id || card.id === card2.id ? { ...card, isMatched: true } : card
          )
        );
        // Add the matched pair to the state
        setMatchedPairs(prevPairs => [...prevPairs, [card1.id, card2.id]]);
        // Increment the score (correct attempts)
        setScore(prevScore => prevScore + 1);

        setSelectedCards([]); // Clear selected cards
        setIsChecking(false); // Allow clicks again
      } else {
        // No match. Increment incorrect attempts
        setIncorrectAttempts(prevAttempts => prevAttempts + 1);

        // Flip cards back after a short delay
        const timeoutId = setTimeout(() => {
          setSelectedCards([]); // Clear selected cards
          setIsChecking(false); // Allow clicks again
        }, 1000); // 1 second delay

        // Cleanup the timeout
        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedCards, row1Cards, row2Cards]); // Depend on selectedCards, and card states for updates

  // Effect to draw lines when matchedPairs changes or window resizes
  useEffect(() => {
    const drawLines = () => {
      const newLineCoordinates = [];
      // Ensure the container ref is available before getting its position
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      matchedPairs.forEach(([id1, id2]) => {
        const card1El = cardRefs.current[id1];
        const card2El = cardRefs.current[id2];

        // Ensure both card elements exist
        if (card1El && card2El) {
          const rect1 = card1El.getBoundingClientRect();
          const rect2 = card2El.getBoundingClientRect();

          // Calculate center points relative to the container
          const x1 = rect1.left + rect1.width / 2 - containerRect.left;
          const y1 = rect1.top + rect1.height / 2 - containerRect.top;
          const x2 = rect2.left + rect2.width / 2 - containerRect.left;
          const y2 = rect2.top + rect2.height / 2 - containerRect.top;

          newLineCoordinates.push({ x1, y1, x2, y2 });
        }
      });
      setLineCoordinates(newLineCoordinates);
    };

    drawLines(); // Draw lines initially and when matchedPairs changes

    // Add event listener for window resize to redraw lines
    window.addEventListener('resize', drawLines);

    // Cleanup the event listener
    return () => {
      window.removeEventListener('resize', drawLines);
    };
  }, [matchedPairs]); // Re-run this effect when matchedPairs changes

  // Effect to check if the game is finished
  useEffect(() => {
    if (matchedPairs.length > 0 && matchedPairs.length === matchingPairsData.length) {
      // All pairs found, show the modal
      setShowModal(true);
    }
  }, [matchedPairs, matchingPairsData.length]); // Depend on matchedPairs and total number of pairs

  // Handler for clicking a card
  const handleCardClick = (clickedCard) => {
    // Ignore clicks if currently checking a match or if the card is already matched
    if (isChecking || clickedCard.isMatched) {
      return;
    }

    // If less than 2 cards are selected, add the clicked card to selectedCards
    if (selectedCards.length < 2) {
      // Prevent selecting the same card twice
      if (!selectedCards.find(card => card.id === clickedCard.id)) {
         // Prevent selecting two cards from the same row
        if (selectedCards.length === 1 && selectedCards[0].id.split('-')[0] === clickedCard.id.split('-')[0]) {
            // Deselect the first card if the user clicks another in the same row
            setSelectedCards([clickedCard]);
        } else {
             setSelectedCards(prevSelected => [...prevSelected, clickedCard]);
        }
      }
    }
  };

  // Function to check if a card is currently selected
  const isCardSelected = (cardId) => {
    return selectedCards.some(card => card.id === cardId);
  };

  // Function to reset the game
  const resetGame = () => {
      const { initialRow1, initialRow2 } = createInitialCards();
      setRow1Cards(initialRow1);
      setRow2Cards(initialRow2);
      setSelectedCards([]);
      setMatchedPairs([]);
      setLineCoordinates([]);
      setScore(0);
      setIncorrectAttempts(0); // Reset incorrect attempts
      setShowModal(false);
      setIsChecking(false);
       // Clear card refs (important for redrawing lines correctly after reset)
      cardRefs.current = {};
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* <h1 className="text-3xl font-bold mb-8">Memory Matching Game</h1> */}

      {/* Button to reset the game */}
      <button
        onClick={resetGame}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-8"
      >
        Reiniciar Juego
      </button>

      {/* Container for cards and SVG overlay */}
      {/* Added relative positioning for absolute SVG overlay */}
      {/* Increased max-w to use more screen width */}
      <div ref={containerRef} className="relative flex flex-col items-center justify-center max-w-4xl mx-auto">
        {/* Row 1 of cards */}
        {/* Increased bottom margin for more space between rows */}
        <div className="flex justify-center mb-22">
          {row1Cards.map(card => (
            <Card
              key={card.id} // Use card.id as the React key
              displayValue={card.displayValue} // Pass the display value
              isMatched={card.isMatched}
              isSelected={isCardSelected(card.id)}
              onClick={() => handleCardClick(card)}
              ref={el => cardRefs.current[card.id] = el} // Attach ref
            />
          ))}
        </div>

        {/* Row 2 of cards */}
        <div className="flex justify-center">
          {row2Cards.map(card => (
            <Card
              key={card.id} // Use card.id as the React key
              displayValue={card.displayValue} // Pass the display value
              isMatched={card.isMatched}
              isSelected={isCardSelected(card.id)}
              onClick={() => handleCardClick(card)}
              ref={el => cardRefs.current[card.id] = el} // Attach ref
            />
          ))}
        </div>

        {/* SVG overlay for drawing lines */}
        {/* Positioned absolutely to cover the card container */}
        {/* pointer-events-none ensures clicks go through to the cards */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {lineCoordinates.map((coords, index) => (
            <line
              key={index}
              x1={coords.x1}
              y1={coords.y1}
              x2={coords.x2}
              y2={coords.y2}
              stroke="red" // Color de la línea
              strokeWidth="4" // Ancho de la línea
              strokeLinecap="round" // Estilo del extremo de la línea
            />
          ))}
        </svg>
      </div>

      {/* Render the Modal component if showModal is true */}
      {showModal && (
        <Modal
          score={score}
          totalPairs={matchingPairsData.length}
          incorrectAttempts={incorrectAttempts} // Pass incorrect attempts
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default App;
