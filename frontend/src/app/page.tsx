"use client";

import React, { useEffect, useState } from "react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

interface KnowledgeNode {
  trigger: string;
  response: string;
}
interface Service {
  id: number;
  title: string;
  category: string | null;
  description: string;
}
interface IndustrySolution {
  id: number;
  industry: string;
  title: string;
  description: string;
}
interface CaseStudy {
  id: number;
  title: string;
  industry: string;
  challenge: string;
  solution: string;
  outcome: string | null;
}
export default function Home() {
  // Navigation: "support" is the full-screen human help form page, while "site" displays the main scrolling page.
  const [currentTab, setCurrentTab] = useState<"site" | "support">("site");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form Fields state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null); 

  // RAG / Knowledge Base dictionary state
  const [knowledgeBase] = useState<KnowledgeNode[]>([
    { trigger: "costs", response: "Pramax's Intelligent Automation frameworks combine custom LLM pipelines with automated process triggers to systematically optimize compute runtime loops, reducing processing operational costs by up to 34%." },
    { trigger: "azure fabric", response: "Pramax drives enterprise Azure Fabric implementation maps by constructing multi-tier unified infrastructure pipelines, seamlessly consolidating fragmented business application pools onto central real-time tracking dashboards." },
    { trigger: "governance", response: "Implementing comprehensive Data Governance matrices secures critical institutional compliance parameters, sets automated tracking guardrails across model nodes, and protects localized customer identities." },
    { trigger: "roadmap", response: "Pramax proposes a multi-tier AI adoption framework roadmap: 1. Core structural environment evaluation, 2. Pilot deployment of internal vector storage clusters, 3. Scale deployment across transactional pipeline endpoints." },
    { trigger: "utility", response: "For the Utility infrastructure sector, we maintain dedicated success cases integrating SCADA telemetry arrays with Azure tracking tools to analyze data streams and flag risk points automatically." },
    { trigger: "cloud migration", response: "Pramax offers full-cycle multi-cloud modernization blueprints, specializing in risk-mitigated database lift-and-shifts, custom API development, and distributed system container refactoring patterns." }
  ]);

  // AI Chatbox Session state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: "ai", text: "Hello! How can I help you discover Pramax’s services today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const [services, setServices] = useState<Service[]>([]);

  const [industrySolutions, setIndustrySolutions] = useState< IndustrySolution[]>([]);

  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);

useEffect(() => {
  const loadServices = async () => {
    const response = await fetch("/api/services");

    if (!response.ok) {
      throw new Error("Could not load services");
    }

    const data = await response.json();
    setServices(data);
  };

  loadServices().catch(console.error);
}, []);


useEffect(() => {
  const loadIndustrySolutions = async () => {
    const response = await fetch("/api/industry-solutions");

    if (!response.ok) {
      throw new Error("Could not load industry solutions");
    }

    const data = await response.json();
    setIndustrySolutions(data);
  };

  loadIndustrySolutions().catch(console.error);
}, []);

useEffect(() => {
  const loadCaseStudies = async () => {
    const response = await fetch("/api/case-studies");

    if (!response.ok) {
      throw new Error("Could not load case studies");
    }

    const data = await response.json();
    setCaseStudies(data);
  };

  loadCaseStudies().catch(console.error);
}, []);

  // Helper: Scroll to a specific section ID on the page
  const scrollToSection = (id: string) => {
    if (currentTab !== "site") {
      setCurrentTab("site");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Submit chat query
  const handleChatSubmit = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { sender: "user", text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, knowledgeBase })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
      } else {
        throw new Error("Local API fallback");
      }
    } catch (e) {
      setTimeout(() => {
        const lowerText = text.toLowerCase();
        const matchedNode = knowledgeBase.find((node) =>
          lowerText.includes(node.trigger.toLowerCase())
        );

        const reply = matchedNode
          ? matchedNode.response
          : "Pramax's support engineers are standing by. We have logged this query. If you need urgent assistance, please click the Human Help button on the bottom left corner.";

        setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (promptText: string) => {
    setChatOpen(true);
    handleChatSubmit(promptText);
  };

   // Submit Human Help ticket
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Client-side Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      setFormStatus("error");
      setErrorMessage("Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    setFormStatus("submitting");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, subject: formSubject })
      });

      if (res.ok) {
        setFormStatus("success");
        setErrorMessage(null);
        // Clear inputs upon success
        setFormName("");
        setFormEmail("");
        setFormSubject("");
      } else {
        // 2. Handle Server-side validation errors (like 400 or 422)
        const errorData = await res.json().catch(() => ({}));
        setFormStatus("error");
        
        if (res.status === 502 || res.status === 500) {
          setErrorMessage("The server is currently unavailable. Please try again later.");
        } else {
          setErrorMessage(errorData.error || "Failed to submit request. Please verify your details.");
        }
      }
    } catch (error) {
      // 3. Handle Network Offline / Server down errors
      setFormStatus("error");
      setErrorMessage("Network error: Server is currently unavailable. Please verify it is running.");
    }
  };

  // Route directly to support tab
  const triggerHumanEscalation = () => {
    const alertMsg: Message = {
      sender: "ai",
      text: "⚠️ Directing to support agent. Loading Human Help portal..."
    };
    setChatMessages((prev) => [...prev, alertMsg]);
    setTimeout(() => {
      setCurrentTab("support");
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Subtle Ambient Background Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[120px] pointer-events-none opacity-70"></div>
      <div className="absolute top-[60rem] right-1/4 w-[35rem] h-[35rem] bg-blue-50 rounded-full blur-[160px] pointer-events-none opacity-60"></div>

      {/* NAVBAR (No human help desk / admin links at all) */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <div
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => scrollToSection("home-section")}
            >
              <img
                src="/logo.jpg"
                alt="Pramax Logo"
                className="h-20 w-auto object-contain py-1"
              />
            </div>

            {/* Desktop Navigation links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("home-section")}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Home Overview
              </button>
              <button
                onClick={() => scrollToSection("services-section")}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Services & Solutions
              </button>
              <button
                onClick={() => scrollToSection("industries-section")}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Industry Solutions
              </button>
              <button
                onClick={() => scrollToSection("cases-section")}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Case Studies
              </button>
            </div>

            {/* Mobile Hamburger menu */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2">
            <button
              onClick={() => {
                scrollToSection("home-section");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-black hover:bg-gray-100"
            >
              Home Overview
            </button>
            <button
              onClick={() => {
                scrollToSection("services-section");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-black hover:bg-gray-100"
            >
              Services & Solutions
            </button>
            <button
              onClick={() => {
                scrollToSection("industries-section");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-black hover:bg-gray-100"
            >
              Industry Solutions
            </button>
            <button
              onClick={() => {
                scrollToSection("cases-section");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-black hover:bg-gray-100"
            >
              Case Studies
            </button>
          </div>
        )}
      </nav>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==========================================
             VIEW A: MAIN SITE - SINGLE SCROLL DOWN PAGE
             ========================================== */}
        {currentTab === "site" ? (
          <div className="space-y-24">
            
            {/* --- SECTION 1: HOME / HERO SECTION --- */}
            <section id="home-section" className="relative pt-16 pb-6 md:pt-24 md:pb-10 text-center scroll-mt-24">
              
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-black mb-6 max-w-4xl mx-auto leading-tight">
                Next-Gen <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-black bg-clip-text text-transparent">GenAI Solutions</span> for Enterprise Systems
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                Pramax couples cross-domain engineering expertise with state-of-the-art AI integration to help modern enterprises discover and deploy automated business environments.
              </p>

              {/* Infosys-Style AI Ask Box (FRONT AND CENTER) */}
              <div id="ai-chat-anchor" className="max-w-3xl mx-auto relative px-4 mb-12 scroll-mt-28">
                {/* Ambient glowing card shadow */}
                <div className="absolute inset-0 bg-blue-500/10 rounded-3xl filter blur-xl -z-10 animate-pulse"></div>

                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xl p-6 relative pt-10 transition-all duration-300">
                  {/* Floating microphone button */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={() => handleQuickReply("Suggest a roadmap for AI adoption in my organization.")}
                      className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 border border-blue-500 cursor-pointer group"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  </div>

                  {/* Active Message Session Logs */}
                  {chatOpen && (
                    <div className="mb-4 border-b border-gray-100 pb-4 text-left">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                          Active AI Assistant
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={triggerHumanEscalation}
                            className="text-[10px] font-mono font-semibold bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded hover:bg-red-100 transition-all"
                          >
                            Route to Human
                          </button>
                          <button
                            onClick={() => {
                              setChatOpen(false);
                              setChatMessages([{ sender: "ai", text: "Hello! How can I help you discover Pramax’s services today?" }]);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {chatMessages.map((msg, index) => (
                          <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[85%] rounded-xl px-4 py-2.5 leading-relaxed text-sm ${
                                msg.sender === "user"
                                  ? "bg-blue-600 text-white font-medium rounded-tr-none"
                                  : "bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-none"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-gray-50 border border-gray-200 text-gray-400 rounded-xl rounded-tl-none px-4 py-2.5 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Input Search Block */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setChatOpen(true);
                      handleChatSubmit(chatInput);
                    }}
                    className="flex items-center space-x-3 border border-gray-200 hover:border-blue-400 rounded-xl p-3 bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-400 pl-1">
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything: cloud migration, adoption roadmap..."
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md flex items-center justify-center cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </form>

                  {/* Suggestion Chips */}
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => handleQuickReply("Which AI solution can help reduce operational costs?")}
                      className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      💰 Reduce Costs?
                    </button>
                    <button
                      onClick={() => handleQuickReply("How can Pramax help with Azure Fabric implementation?")}
                      className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      ☁️ Azure Fabric?
                    </button>
                    <button
                      onClick={() => handleQuickReply("What are the benefits of implementing Data Governance?")}
                      className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      ⚖️ Data Governance
                    </button>
                    <button
                      onClick={() => handleQuickReply("Show me relevant case studies for the Utility industry.")}
                      className="text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      📊 Utilities Case
                    </button>
                  </div>

                  {/* Secure info status bar */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-medium space-y-2 sm:space-y-0">
                    <span className="flex items-center">
                      <svg className="w-3.5 h-3.5 text-emerald-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Secure & Private Session
                    </span>
                    <span>Content generated with AI assistance</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => scrollToSection("services-section")}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-black hover:bg-gray-800 rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Explore Solutions
                </button>
                <button
                  onClick={() => handleQuickReply("Suggest a roadmap for AI adoption in my organization.")}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer"
                >
                  ⚡ Ask AI Adoption Roadmap
                </button>
              </div>
            </section>

            {/* --- SECTION 2: CORPORATE OVERVIEW --- */}
            <section className="py-6">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 sm:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">
                      Enterprise Technology Domain Expertise
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      Modern prospective customers often look to scale architectures but struggle to identify which technology combinations precisely align with complex localized operational friction. Pramax eliminates navigating guesswork through active language-driven engagement models.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-sm font-semibold text-black">Data & AI Engineering</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-sm font-semibold text-black">Cloud Transformation</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-sm font-semibold text-black">Intelligent Automation</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-sm font-semibold text-black">Product Engineering</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-2">
                      Core Optimization Parameters
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span>Automated Discovery Model</span>
                          <span className="text-blue-600 font-semibold">94%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "94%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span>Workload Operational Cost Scaling</span>
                          <span className="text-blue-600 font-semibold">34% Savings</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "82%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* --- SECTION 3: SERVICES & SOLUTIONS --- */}
            <section id="services-section" className="py-6 scroll-mt-24">
  <div className="text-center mb-16">
    <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
      Services & Solutions Architecture
    </h2>
    <p className="text-gray-600 max-w-2xl mx-auto">
      Comprehensive end-to-end framework capabilities mapping across the enterprise application lifecycle.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {services.length === 0 ? (
      <p className="col-span-full text-center text-gray-500">
        Loading services...
      </p>
    ) : (
      services.map((service) => (
        <div
          key={service.id}
          className="bg-white border border-gray-200 p-8 rounded-2xl relative shadow-sm group hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl text-blue-600 font-bold mb-4">
            ✦
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
            {service.category ?? "Pramax Service"}
          </p>

          <h3 className="text-xl font-bold text-black mb-2">
            {service.title}
          </h3>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {service.description}
          </p>

          <button
            onClick={() =>
              handleQuickReply(`Tell me about Pramax's ${service.title}`)
            }
            className="text-xs text-blue-600 font-semibold hover:text-blue-800 hover:underline cursor-pointer"
          >
            Query Capability Assistant →
          </button>
        </div>
      ))
    )}
  </div>
</section>

            {/* --- SECTION 4: INDUSTRY SOLUTIONS --- */}
            <section id="industries-section" className="py-6 scroll-mt-24">
  <div className="text-center mb-16">
    <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
      Industry-Specific Solution Frameworks
    </h2>
    <p className="text-gray-600 max-w-2xl mx-auto">
      Tailored Pramax solutions for different business sectors.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {industrySolutions.length === 0 ? (
      <p className="col-span-full text-center text-gray-500">
        No industry solutions available yet.
      </p>
    ) : (
      industrySolutions.map((solution) => (
        <div
          key={solution.id}
          className="bg-gray-50 border border-gray-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm"
        >
          <div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-100 border border-blue-200 text-blue-700 font-semibold">
              {solution.industry}
            </span>

            <h3 className="text-xl font-bold text-black mt-4 mb-2">
              {solution.title}
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed">
              {solution.description}
            </p>
          </div>

          <button
            onClick={() =>
              handleQuickReply(
                `Tell me about Pramax solutions for ${solution.industry}`
              )
            }
            className="mt-6 text-xs text-blue-600 font-semibold text-left hover:text-blue-800 hover:underline cursor-pointer"
          >
            Query Capability Assistant →
          </button>
        </div>
      ))
    )}
  </div>
</section>

            {/* --- SECTION 5: CASE STUDIES --- */}
           <section id="cases-section" className="py-6 scroll-mt-24">
  <div className="text-center mb-16">
    <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
      Case Studies & Success Stories
    </h2>
    <p className="text-gray-600 max-w-2xl mx-auto">
      Examples of approved Pramax solutions for enterprise challenges.
    </p>
  </div>

  <div className="space-y-8">
    {caseStudies.length === 0 ? (
      <p className="text-center text-gray-500">
        No case studies available yet.
      </p>
    ) : (
      caseStudies.map((caseStudy) => (
        <article
          key={caseStudy.id}
          className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            {caseStudy.industry}
          </span>

          <h3 className="text-xl font-bold text-black mt-2 mb-4">
            {caseStudy.title}
          </h3>

          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              <span className="font-semibold text-black">Challenge: </span>
              {caseStudy.challenge}
            </p>

            <p>
              <span className="font-semibold text-black">Pramax solution: </span>
              {caseStudy.solution}
            </p>

            {caseStudy.outcome && (
              <p>
                <span className="font-semibold text-black">Outcome: </span>
                {caseStudy.outcome}
              </p>
            )}
          </div>
        </article>
      ))
    )}
  </div>
</section>

            {/* STICKY FLOATING BUTTON AT BOTTOM-RIGHT FOR HUMAN SUPPORT */}
            <button
              onClick={() => setCurrentTab("support")}
              className="fixed bottom-6 right-6 z-50 bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-full flex items-center space-x-2 shadow-2xl transition-all hover:scale-105 border border-gray-800 cursor-pointer animate-pulse"
            >
              <span className="text-lg">👤</span>
              <span className="text-xs font-semibold tracking-wide">Connect with human help</span>
            </button>

          </div>
        ) : (
          
          /* ==========================================
               VIEW B: SUPPORT INITIATE SYSTEM DISCOVERY VIEW
               ========================================== */
          <section className="py-8 max-w-2xl mx-auto animate-fadeIn min-h-[70vh] flex flex-col justify-center">
            
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
              
              {/* Back Navigation */}
              <button
                onClick={() => setCurrentTab("site")}
                className="absolute top-6 left-6 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>←</span> <span>Back to Website</span>
              </button>

              <div className="text-center mt-6 mb-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl mb-3">👤</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">Initiate System Discovery</h2>
                <p className="text-gray-600 text-sm">Please submit your project parameters to connect with a support specialist.</p>
              </div>

                            {formStatus === "success" ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center rounded-2xl mb-2 animate-fadeIn animate-duration-300">
                  <p className="font-semibold text-lg mb-1">✓ Request Logged Successfully</p>
                  <p className="text-sm text-emerald-700">Your help request has been queued. A Pramax consultant will email you shortly.</p>
                  <button 
                    onClick={() => {
                      setFormStatus("idle");
                      setCurrentTab("site");
                    }} 
                    className="mt-6 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Return to Home Overview
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Error Message Banner */}
                  {formStatus === "error" && errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl mb-4 animate-fadeIn">
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Full Name</label>
                    <input
                      required
                      type="text"
                      disabled={formStatus === "submitting"}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-65"
                      placeholder="e.g. Sarah Jenkins"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Business Email</label>
                    <input
                      required
                      type="email"
                      disabled={formStatus === "submitting"}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-65"
                      placeholder="sarah@enterprise.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Subject</label>
                    <input
                      required
                      type="text"
                      disabled={formStatus === "submitting"}
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-65"
                      placeholder="e.g. Requesting custom cloud integration guidelines..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus === "submitting"}
                    className="w-full inline-flex items-center justify-center px-6 py-4 font-semibold text-white bg-black hover:bg-gray-800 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formStatus === "submitting" ? (
                      <span className="flex items-center space-x-2">
                        {/* Loading Spinner */}
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Submitting Request...</span>
                      </span>
                                        ) : (
                      "Connect with Human Help"
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}