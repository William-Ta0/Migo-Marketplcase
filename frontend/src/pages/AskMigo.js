import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import "../styles/AskMigo.css";
import { serviceTypes } from "../constants/serviceTypes";

const ai = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GOOGLE_GEMINI_API_KEY,
});

const AskMigo = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [guidedStep, setGuidedStep] = useState(0);

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

  const guidedQuestions = [
    {
      question: "What kind of service are you looking for?",
      options: currentServices,
    },
    {
      question: "Do you have a specific service in mind?",
      options: ["Yes", "No"],
    },
  ];

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const recommendServices = (selectedService) => {
    const recommendations = currentServices.filter(
      (service) => service !== selectedService
    );

    const botMessage = {
      sender: "bot",
      text: `Based on your selection, we recommend the following services: ${recommendations.join(
        ", "
      )}`,
    };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  };

  const recommendBusinesses = (selectedService) => {
    const businesses = santaClaraBusinesses.filter(
      (business) => business.service === selectedService
    );

    const botMessage = {
      sender: "bot",
      text: `Here are some businesses in Santa Clara offering ${selectedService}: ${businesses
        .map((b) => b.name)
        .join(", ")}`,
    };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  };

  const handleOptionSelect = (option) => {
    const userMessage = { sender: "user", text: option };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (guidedStep === 0) {
      recommendServices(option);
      recommendBusinesses(option);
    }

    if (guidedStep < guidedQuestions.length - 1) {
      setGuidedStep(guidedStep + 1);
    } else {
      // Transition to free-form chat
      setGuidedStep(-1);
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

        {guidedStep >= 0 && (
          <div className="guided-question">
            <p>{guidedQuestions[guidedStep].question}</p>
            <div className="options">
              {guidedQuestions[guidedStep].options.map((option, index) => (
                <button
                  key={index}
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
