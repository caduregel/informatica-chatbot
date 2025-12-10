import { useState } from "react";
import "./App.css";
import { Button, Input, Space } from "antd";
import { SendOutlined } from "@ant-design/icons";
import lars from "./assets/lars.png";
import { GoogleGenAI } from "@google/genai";

interface IMessage {
  sender: "user" | "bot";
  text: string;
}

function ChatMessages({
  userMessages,
  chatbotMessages,
}: {
  userMessages: string[];
  chatbotMessages: string[];
}) {
  const combinedMessages: IMessage[] = [];

  const maxLen = Math.max(userMessages.length, chatbotMessages.length);
  for (let i = 0; i < maxLen; i++) {
    if (chatbotMessages[i]) {
      combinedMessages.push({ sender: "bot", text: chatbotMessages[i] });
    }
    if (userMessages[i]) {
      combinedMessages.push({ sender: "user", text: userMessages[i] });
    }
  }

  // console.log(combinedMessages);
  return (
    <div className="messages-container">
      {combinedMessages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.sender === "user" ? "left" : "right"}`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [chatMessageValue, setChatMessageValue] = useState<string>("");
  const [chatbotLoading, setChatbotLoading] = useState<boolean>(false);
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [hasProvidedSecret, setHasProvidedSecret] = useState<boolean>(false);

  const [chatbotMessages, setChatbotMessages] = useState<string[]>([
    "Hallo! Ik ben Lars, voordat je van mij gebruik kan maken moet je mij de geheime code vertellen",
  ]);

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const sendMessage = async () => {
    // check if user has provided secret key
    if (!hasProvidedSecret) {
      if (chatMessageValue === import.meta.env.VITE_SECRET_KEY) {
        setHasProvidedSecret(true);
        const userMessagesCopy = [...userMessages];
        userMessagesCopy.push(chatMessageValue);
        setUserMessages(userMessagesCopy);
        const chatbotMessagesCopy = [...chatbotMessages];
        chatbotMessagesCopy.push(
          "Bedankt! Je kunt nu met mij chatten. Waar wil je het over hebben?"
        );
        setChatbotMessages(chatbotMessagesCopy);
      } else {
        const userMessagesCopy = [...userMessages];
        userMessagesCopy.push(chatMessageValue);
        setUserMessages(userMessagesCopy);

        const chatbotMessagesCopy = [...chatbotMessages];
        chatbotMessagesCopy.push("Onjuiste geheime code. Probeer het opnieuw.");
        setChatbotMessages(chatbotMessagesCopy);
      }
      setChatMessageValue("");
      return;
    }

    // if bot loading, do nothing
    if (chatbotLoading) return;
    setChatbotLoading(true);

    // alter user messages array
    const userMessagesCopy = [...userMessages];
    userMessagesCopy.push(chatMessageValue);
    setUserMessages(userMessagesCopy);

    const chatbotMessagesCopy = [...chatbotMessages];
    chatbotMessagesCopy.push("Aan het laden..."); // placeholder while loading
    setChatbotMessages(chatbotMessagesCopy);

    const promptText =
      "To the following question, " +
      "Be very direct, answer very angrily, always insult the person asking the question" +
      "Answer in plain text only, no markdown, keep your answer under 50 words, speak dutch, your name is Lars. Question: ";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText + chatMessageValue,
    });

    // remove placeholder
    chatbotMessagesCopy.pop();
    chatbotMessagesCopy.push(
      response.text ? response.text : "Ik weet het niet."
    );
    setChatbotMessages(chatbotMessagesCopy);

    setChatMessageValue("");
    setChatbotLoading(false);
  };

  return (
    <>
      <div className="main">
        <div className="header">
          <h1>Chatbot Lars</h1>
          <img src={lars} alt="" width="50px" height="50px" />
        </div>
        <Space.Compact
          style={{
            height: "100%",
            marginBottom: "50px",
            maxWidth: "38vw",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ChatMessages
            userMessages={userMessages}
            chatbotMessages={chatbotMessages}
          />
        </Space.Compact>
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            padding: "12px 0",
            background: "white", // optional, prevents overlap with content
            zIndex: 999, // ensure it stays on top
          }}
        >
          <Space.Compact
            style={{ maxWidth: "40vw", width: "100%", justifySelf: "end" }}
          >
            <Input
              value={chatMessageValue}
              onChange={(value) => {
                setChatMessageValue(value.target.value);
              }}
              onPressEnter={sendMessage}
              placeholder="Chat met chatbot Lars!"
              className="Chatinput"
            />
            <Button type="primary" onClick={sendMessage}>
              <SendOutlined />
            </Button>
          </Space.Compact>
        </div>
      </div>
    </>
  );
}

export default App;
