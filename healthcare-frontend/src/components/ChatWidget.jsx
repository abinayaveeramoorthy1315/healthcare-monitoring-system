import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaRobot, FaTimes, FaPaperPlane, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import "./ChatWidget.css";

const ChatWidget = ({ patientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm your Health Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-IN"); // en-IN or ta-IN
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = voiceLang;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? " " : "") + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [voiceLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = voiceLang;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8080/api/chatbot/query",
        {
          patientId: patientId,
          message: input,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const botMessage = { sender: "bot", text: response.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="chat-widget-container">
      {isOpen ? (
        <div className="chat-window">
          <div className="chat-header">
            <span>🤖 Health Assistant</span>
            <div className="header-controls">
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="lang-select"
              >
                <option value="en-IN">EN</option>
                <option value="ta-IN">தமிழ்</option>
              </select>
              <FaTimes className="close-icon" onClick={() => setIsOpen(false)} />
            </div>
          </div>

          <div className="chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble bot-bubble typing">Typing...</div>
            )}
            {isListening && (
              <div className="chat-bubble bot-bubble listening">🎙️ Listening...</div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-area">
            <button
              className={`mic-btn ${isListening ? "mic-active" : ""}`}
              onClick={toggleListening}
              title={voiceLang === "ta-IN" ? "தமிழில் பேசுங்கள்" : "Speak in English"}
            >
              {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type or speak... / தட்டச்சு செய்யவும்..."
            />
            <button onClick={sendMessage}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      ) : (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <FaRobot size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;