import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import "../styles/AskMigo.css";
import { serviceTypes } from "../constants/serviceTypes";
import { dummyServices } from "../constants/dummyServices";
import { handleSearch } from "../pages/MapPage";

const ai = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GOOGLE_GEMINI_API_KEY,
});

const AskMigo = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [guidedStep, setGuidedStep] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [mapResults, setMapResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Only offering in person services
  const currentServices = serviceTypes;

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const recommendServices = (selectedService) => {
    const recommendations = currentServices.filter(
      (service) =>
        service !== selectedService && service.includes(selectedService)
    );

    const botMessage = {
      sender: "bot",
      text: recommendations.length
        ? `Based on your selection, we recommend the following services: ${recommendations.join(
            ", "
          )}`
        : "Sorry, we couldn't find any related services to recommend.",
    };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  };

  const recommendBusinesses = async (selectedService) => {
    const businesses = dummyServices.filter(
      (service) => service.service === selectedService
    );

    const botMessage = {
      sender: "bot",
      text: `Promoted businesses in Santa Clara offering ${selectedService}: ${businesses
        .map((b) => b.name)
        .join(", ")}`,
    };
    setMessages((prevMessages) => [...prevMessages, botMessage]);

    try {
      const searchResults = await handleSearch(selectedService);
      setMapResults(searchResults);
      const searchMessage = {
        sender: "bot",
        text: `Other businesses found offering ${selectedService}: ${searchResults
          .map((r) => r.name)
          .join(", ")}`,
      };
      setMessages((prevMessages) => [...prevMessages, searchMessage]);
      return searchResults;
    } catch (error) {
      console.error("Error searching for businesses:", error);
      const errorMessage = {
        sender: "bot",
        text: "Sorry, we couldn't find additional businesses at this time.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      return [];
    }
  };

  const handleOptionSelect = async (option) => {
    const userMessage = { sender: "user", text: option };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (guidedStep === 0) {
      setSelectedService(option);
      recommendServices(option);
      await recommendBusinesses(option);
      setGuidedStep(1);
      return;
    }
    if (guidedStep === 1) {
      const business = option;
      const serviceInfo = dummyServices.find((s) => s.name === business) || {};
      setIsTyping(true);
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `You are ${serviceInfo.name}, a ${serviceInfo.service} provider. Owner: ${serviceInfo.ownerName}. Address: ${serviceInfo.address}. Phone: ${serviceInfo.phone}. You have ${serviceInfo.ratingsCount} reviews with an average rating of ${serviceInfo.ratingValue}. Please provide a short, human-like quote and any additional details to a potential client.`,
        });
        const botMessage = { sender: "bot", text: response.text };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Error interacting with Gemini API:", error);
        const errorMsg = {
          sender: "bot",
          text: "Sorry, we couldn't process your request. Please try again later.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
      setGuidedStep(-1);
      return;
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    const userMessage = { sender: "user", text: userInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsTyping(true);

    try {
      const context = `Available services in Santa Clara, CA: ${currentServices.join(
        ", "
      )}.
Businesses offering these services: ${dummyServices
        .map((s) => `${s.name} (${s.service})`)
        .join(", ")}.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${context}\nUser input: ${userInput}\n\nPlease keep your response short and human-like.`,
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
    } finally {
      setIsTyping(false);
    }

    setUserInput("");
  };

  const clearChat = () => {
    setMessages([]);
  };

  const startOver = () => {
    setMessages([]);
    setGuidedStep(0);
  };

  // prepare dynamic business options after selection
  const dummyBusinessNames = dummyServices
    .filter((s) => s.service === selectedService)
    .map((s) => s.name);
  const businessOptions = [
    ...new Set([...dummyBusinessNames, ...mapResults.map((r) => r.name)]),
  ];

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
        {isTyping && (
          <div className="message-bubble bot-bubble typing-indicator">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        )}

        {guidedStep === 0 && (
          <div className="guided-question">
            <p>What kind of service are you looking for?</p>
            <div className="options">
              {currentServices.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className="option-button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        {guidedStep === 1 && (
          <div className="guided-question">
            <p>
              Which business would you like to contact for {selectedService}?
            </p>
            <div className="options">
              {businessOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className="option-button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
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
        <button onClick={startOver} className="start-over-button">
          Start Over
        </button>
      </div>
    </div>
  );
};

export default AskMigo;
