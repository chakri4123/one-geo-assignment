import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Chatbot({ datasetId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        setMessages([]);
        setInput("");
    }, [datasetId]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: "user", content: input.trim() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/chat/${datasetId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: userMsg.content,
                        history: messages,
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Chat failed");
            }

            const data = await response.json();
            setMessages([
                ...newMessages,
                { role: "assistant", content: data.reply },
            ]);
        } catch (err) {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: `Error: ${err.message}`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Floating toggle button
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                disabled={!datasetId}
                title={datasetId ? "Chat with your data" : "Upload a dataset first"}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full text-white border-none flex items-center justify-center text-xl shadow-lg transition-all z-[1000] ${datasetId
                        ? "bg-gray-900 hover:bg-gray-800 cursor-pointer hover:scale-110"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>
        );
    }

    // Chat panel
    return (
        <div className="fixed bottom-6 right-6 w-[400px] h-[540px] rounded-xl overflow-hidden flex flex-col shadow-2xl z-[1000] border border-gray-200">

            {/* Header */}
            <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
                <div>
                    <div className="text-white font-semibold text-sm">
                        Well Data Assistant
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">
                        Ask questions about your well-log data
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white border-none bg-transparent cursor-pointer text-lg w-8 h-8 flex items-center justify-center rounded transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        <div className="text-gray-300 text-3xl mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                            </svg>
                        </div>
                        Ask questions about your well-log data
                        <div className="mt-4 flex flex-col gap-1.5">
                            {[
                                "What curves are available?",
                                "Summarize the data",
                                "Any anomalies detected?",
                            ].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setInput(q)}
                                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 cursor-pointer text-left hover:border-gray-900 hover:text-gray-900 transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-gray-900 text-white rounded-t-xl rounded-bl-xl"
                                    : "bg-white text-gray-800 rounded-t-xl rounded-br-xl shadow-sm border border-gray-100"
                                }`}
                        >
                            {msg.role === "user" ? (
                                msg.content
                            ) : (
                                <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-2 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-1.5 [&_h3]:mb-1 [&_strong]:font-semibold [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-3 rounded-t-xl rounded-br-xl shadow-sm border border-gray-100 text-sm text-gray-400">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200 flex gap-2 items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your data..."
                    disabled={loading}
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 outline-none text-sm bg-gray-50 focus:border-gray-900 transition-colors"
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className={`w-10 h-10 rounded-lg border-none flex items-center justify-center text-white transition-all flex-shrink-0 ${loading || !input.trim()
                            ? "bg-gray-200 cursor-not-allowed"
                            : "bg-gray-900 hover:bg-gray-800 cursor-pointer"
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
