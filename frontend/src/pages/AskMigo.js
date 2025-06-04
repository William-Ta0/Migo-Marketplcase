import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import "../styles/AskMigo.css";
import { serviceTypes } from "../constants/serviceTypes";
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

  // Only offering in person services
  const currentServices = serviceTypes;

  // Dummy data for Santa Clara businesses
  const santaClaraBusinesses = [
    { name: "Santa Clara Catering Co.", service: "Catering" },
    { name: "Clean Sweep Santa Clara", service: "Cleaning" },
    { name: "Plumbing Pros SC", service: "Plumbing" },
    { name: "Santa Clara Electricians", service: "Electrical" },
    { name: "Green Thumb Landscaping", service: "Landscaping" },
    { name: "Perfect Paints", service: "Painting" },
    { name: "Sweet Treats Bakery", service: "Baked Goods" },
    { name: "Decor Experts", service: "Decorating" },
    { name: "DJ Vibes", service: "DJ Services" },
    { name: "Photo Magic", service: "Photography" },
    { name: "Pest Busters", service: "Pest Control" },
    { name: "Move It Movers", service: "Moving Services" },
    { name: "Pet Pals", service: "Pet Care" },
    { name: "Tutor Time", service: "Tutoring" },
  ];

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
    const businesses = santaClaraBusinesses.filter(
      (business) => business.service === selectedService
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
          .map((result) => result.name)
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
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `You are ${business}, a ${selectedService} provider located at Santa Clara University. Please provide a quote and any additional information as a business owner to a potential client.`,
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
      }
      setGuidedStep(-1);
      return;
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    const userMessage = { sender: "user", text: userInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const context = `Available services in Santa Clara, CA: ${currentServices.join(
        ", "
      )}.\nBusinesses offering these services: ${santaClaraBusinesses
        .map((b) => `${b.name} (${b.service})`)
        .join(", ")}.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${context}\nUser input: ${userInput}`,
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

  const startOver = () => {
    setMessages([]);
    setGuidedStep(0);
  };

  // prepare dynamic business options after selection
  const dummyBusinessNames = santaClaraBusinesses
    .filter((b) => b.service === selectedService)
    .map((b) => b.name);
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
