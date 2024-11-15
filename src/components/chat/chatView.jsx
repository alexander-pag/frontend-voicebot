import React, { useState, useEffect } from "react";
import api from "../../api";

const VoiceToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [cost, setCost] = useState(null);
  const [wordCount, setWordCount] = useState(null);
  const [tokenCount, setTokenCount] = useState(null);

  const [newVariable, setNewVariable] = useState(0);
  const [emocionesCount, setemocionesCount] = useState(null);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaRecorder(new MediaRecorder(stream));
      setError("");
    } catch (err) {
      setStatus("⚠️ Permiso de micrófono denegado");
      setError(
        "Error: Se requieren permisos de micrófono para esta aplicación."
      );
    }
  };
  const playAudio = (audioUrl) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  useEffect(() => {
    requestMicrophonePermission();
  }, []);

  const sendAudioToBackend = (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");

    api
      .post("/api/chat/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        addChatMessage(response.data.text, "user");
        addChatMessage(response.data.response, "bot");
        setemocionesCount(true);

        setCost((prevState) => prevState + response.data.cost);
        setTokenCount((prevState) => prevState + response.data.token_count);
        setWordCount((prevState) => prevState + response.data.word_count);

        const audioUrl = response.data.audioUrl;
        playAudio(audioUrl);

        if (
          response.data.user_emotion !== 0 &&
          response.data.user_emotion !== null &&
          response.data.user_emotion !== undefined
        ) {
          setNewVariable(
            (prevValue) => (prevValue + response.data.user_emotion) / 2
          );
        }
      })

      .catch((error) => {
        setError(`Error al comunicarse con el servidor: ${error.message}`);
      });
  };

  const startRecording = () => {
    if (mediaRecorder) {
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        sendAudioToBackend(audioBlob);
      };
      mediaRecorder.start();
      setIsListening(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isListening) {
      mediaRecorder.stop();
      setIsListening(false);
    }
  };

  const handleStartButtonClick = () => {
    setShowWelcomeMessage(false);
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleExportConversation = () => {
    console.log(chatMessages);

    // exportar el archivo indicando quien es el emisor
    const messages = chatMessages.map((message) => {
      return `${message.sender === "user" ? "Usuario" : "Bot"}: ${
        message.text
      }`;
    });

    const blob = new Blob([messages.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conversacion.txt";
    a.click();
  };

  const handleStartConversation = () => {
    addChatMessage("Hola, en qué puedo ayudarte?", "bot");
  };

  const addChatMessage = (text, sender) => {
    setChatMessages((prevMessages) => [...prevMessages, { text, sender }]);
  };

  return (
    <div className="container">
      <h1 className="title">VoiceBot</h1>
      <div id="permissions-warning" className="permissions-warning">
        ⚠️ Se requieren permisos de micrófono para esta aplicación
      </div>

      <button onClick={handleStartConversation} className="interaction-button">
        Iniciar interacción
      </button>

      <div id="chat" className="chat-container">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${
              message.sender === "user" ? "user-message" : "bot-message"
            }`}
            dangerouslySetInnerHTML={{ __html: message.text }} // Esto procesará el HTML
          />
        ))}
      </div>
      {showWelcomeMessage && (
        <div className="message_bienvenida">¿En qué puedo ayudarte?</div>
      )}

      <div className="botones">
        <button
          id="start"
          onClick={handleStartButtonClick}
          disabled={status.includes("Permiso denegado")}
          className="start-button"
        >
          <i className={`fa ${isListening ? "fa-stop" : "fa-microphone"}`} />
        </button>

        <button
          id="export"
          onClick={handleExportConversation}
          className="export-button"
        >
          <i className="fa fa-file-export"></i>
        </button>

        <button
          id="text"
          onClick={handleStartButtonClick}
          className="text-button"
        >
          <i className="fa fa-chart-bar"></i>
        </button>

        <button
          id="cost"
          onClick={handleStartButtonClick}
          className="cost-button"
        >
          <i className={"fa fa-piggy-bank"} />
        </button>

        <p id="status">{status}</p>
        {error && (
          <p id="error" className="error">
            {error}
          </p>
        )}
      </div>

      <div>
        <h2 id="title">Resultados</h2>
        {cost && <p id="cost">Costo: {cost}</p>}
        {tokenCount && <p id="tokenCount">Conteo de tokens: {tokenCount}</p>}
        {wordCount && <p id="wordCount">Conteo de palabras: {wordCount}</p>}

        {emocionesCount && (
          <div>
            {newVariable >= -1 && newVariable <= -0.7 && (
              <p style={{ color: "red" }}>Muy Insatisfecho {newVariable}</p>
            )}
            {newVariable > -0.7 && newVariable <= -0.5 && (
              <p style={{ color: "purple" }}>Insatisfecho {newVariable}</p>
            )}
            {newVariable > -0.5 && newVariable <= 0.1 && (
              <p style={{ color: "blue" }}>Neutro {newVariable}</p>
            )}
            {newVariable > 0.1 && newVariable <= 0.7 && (
              <p style={{ color: "yellow" }}>Satisfecho {newVariable}</p>
            )}
            {newVariable > 0.7 && newVariable <= 1 && (
              <p style={{ color: "yellow" }}>Muy Satisfecho {newVariable}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceToText;