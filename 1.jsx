"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  // State for image generation
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

  // State for chat interface
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Sample data for the table
  const [tableData] = useState([
    {
      id: 1,
      type: "Image Generation",
      prompt: "A sunset over mountains",
      timestamp: "2025-03-20 10:30",
    },
    {
      id: 2,
      type: "Chat",
      prompt: "Explain AI concepts",
      timestamp: "2025-03-20 10:35",
    },
    {
      id: 3,
      type: "Image Generation",
      prompt: "A futuristic city",
      timestamp: "2025-03-20 10:40",
    },
  ]);

  // Handle image generation
  const generateImage = async () => {
    if (!imagePrompt) return;
    setImageLoading(true);
    try {
      const response = await fetch(
        `/integrations/dall-e-3/?prompt=${encodeURIComponent(imagePrompt)}`
      );
      if (!response.ok) throw new Error("Failed to generate image");
      const data = await response.json();
      setGeneratedImage(data.data[0]);
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setImageLoading(false);
    }
  };

  // Handle chat messages
  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: (message) => {
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
      setStreamingMessage("");
      setChatLoading(false);
    },
  });

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const newMessage = { role: "user", content: currentMessage };
    setMessages((prev) => [...prev, newMessage]);
    setCurrentMessage("");
    setChatLoading(true);

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      handleStreamResponse(response);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Image Generation Section */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">Image Generation</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={generateImage}
              disabled={imageLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {imageLoading ? "Generating..." : "Generate"}
            </button>
          </div>
          {generatedImage && (
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full max-w-md mx-auto rounded-lg shadow"
            />
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-lg p-6 shadow-md overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">AI Activity Log</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prompt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{row.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.prompt}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chat Interface Section */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">Chat Interface</h2>
          <div className="h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
                  } max-w-[80%]`}
                >
                  {msg.content}
                </div>
              ))}
              {streamingMessage && (
                <div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">
                  {streamingMessage}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded"
                disabled={chatLoading}
              />
              <button
                onClick={sendMessage}
                disabled={chatLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {chatLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;