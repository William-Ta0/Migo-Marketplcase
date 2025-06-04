import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import "../styles/AskMigo.css";

const ai = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GOOGLE_GEMINI_API_KEY,
});

const AskMigo = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    const userMessage = { sender: "user", text: userInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: userInput,
      });
      const botMessage = { sender: "bot", text: response.text };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error interacting with Gemini API:", error);
      const errorMessage = {
        sender: "bot",
        text: "Sorry, we couldn't process your request. Please try again later.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    setUserInput("");
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="ask-migo-container">
      <h1>Ask Migo</h1>
      <div className="chat-box">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-bubble ${
              message.sender === "user" ? "user-bubble" : "bot-bubble"
            }`}
          >
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div className="input-container">
        <textarea
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type your message here..."
        ></textarea>
        <button onClick={handleSubmit}>Send</button>
        <button onClick={clearChat} className="clear-chat-button">
          Clear Chat
        </button>
      </div>
    </div>
  );
};

export default AskMigo;
