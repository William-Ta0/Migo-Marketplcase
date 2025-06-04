import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GOOGLE_GEMINI_API_KEY });

const AskMigo = () => {
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: userInput,
      });
      setResponse(response.text);
    } catch (error) {
      console.error("Error interacting with Gemini API:", error);
      setResponse(
        "Sorry, we couldn't process your request. Please try again later."
      );
    }
  };

  return (
    <div>
      <h1>Ask Migo</h1>
      <p>Welcome to the Ask Migo page! How can we assist you today?</p>
      <textarea
        value={userInput}
        onChange={handleInputChange}
        placeholder="Type your question here..."
      ></textarea>
      <button onClick={handleSubmit}>Submit</button>
      {response && <p>{response}</p>}
    </div>
  );
};

export default AskMigo;
