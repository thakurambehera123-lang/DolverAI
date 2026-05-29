import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "../components/Router";
import { db, handleFirestoreError, OperationType } from "../firebase";
import Logo from "../components/Logo";
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { ChatSession, ChatMessage } from "../types";
import { 
  Menu, 
  Plus, 
  Trash2, 
  Bot, 
  Home, 
  Sun, 
  Moon, 
  LogOut, 
  UserSquare2,
  X,
  Check,
  Copy,
  Sparkles,
  ArrowLeft,
  ArrowUp,
  GraduationCap,
  Compass,
  Pencil,
  Pin,
  PinOff,
  Search,
  ArrowUpDown,
  Paperclip,
  Image,
  FileText,
  File
} from "lucide-react";
import FormattedMessage from "../components/FormattedMessage";
import ProfileDrawer from "../components/ProfileDrawer";

interface ChatViewProps {
  mode: "academic" | "non-academic";
}

export default function ChatView({ mode }: ChatViewProps) {
  const { user, profile, incrementUsage, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { navigate } = useNavigate();
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Advanced features states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isGeneratingTitleId, setIsGeneratingTitleId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [errorHeader, setError] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = (messageId: string, text: string) => {
    if (!text) return;
    
    // Modern helper
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMessageId(messageId);
        setTimeout(() => {
          setCopiedMessageId(null);
        }, 2000);
      }).catch((err) => {
        console.warn("Navigator clipboard failed, falling back...", err);
        fallbackCopyText(messageId, text);
      });
    } else {
      fallbackCopyText(messageId, text);
    }
  };

  const fallbackCopyText = (messageId: string, text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedMessageId(messageId);
        setTimeout(() => {
          setCopiedMessageId(null);
        }, 2000);
      } else {
        console.error("Fallback copy was unsuccessful");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
  };
  
  // File attachments states and refs
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close attachment menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const compressImage = (file: File, maxWidth = 640, maxHeight = 640, quality = 0.60): Promise<{ dataUrl: string; size: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ dataUrl: event.target?.result as string, size: file.size });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          const format = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(format, quality);
          
          const stringLength = dataUrl.length - dataUrl.indexOf(",") - 1;
          const sizeInBytes = Math.ceil(stringLength * 0.75);

          resolve({ dataUrl, size: sizeInBytes });
        };
        img.onerror = () => {
          resolve({ dataUrl: event.target?.result as string, size: file.size });
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        resolve({ dataUrl: "", size: 0 });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, filterType: "image" | "all") => {
    const files = e.target.files;
    if (!files) return;

    setError("");
    const fileList = Array.from(files);
    
    // Read and compress all selected attachments in parallel
    const promises = fileList.map(async (file) => {
      const isImg = file.type.startsWith("image/");
      const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB limit for speed + database security
      
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" exceeds the maximum 8MB size limit.`);
      }

      if (isImg) {
        try {
          const { dataUrl, size } = await compressImage(file, 640, 640, 0.60);
          if (!dataUrl) return null;
          return {
            name: file.name,
            type: file.type || "image/jpeg",
            size: size,
            url: dataUrl
          };
        } catch (error) {
          console.error("Image compression error for:", file.name, error);
          if (file.size <= 300 * 1024) { // small fallback fallback
            return new Promise((resolve) => {
              const r = new FileReader();
              r.onloadend = () => {
                resolve({
                  name: file.name,
                  type: file.type || "image/jpeg",
                  size: file.size,
                  url: r.result as string
                });
              };
              r.readAsDataURL(file);
            });
          }
          return null;
        }
      } else {
        return new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size,
              url: r.result as string
            });
          };
          r.readAsDataURL(file);
        });
      }
    });

    try {
      const results = await Promise.all(promises);
      const validAttachments = results.filter((item): item is any => item !== null);
      if (validAttachments.length > 0) {
        setSelectedAttachments((prev) => [...prev, ...validAttachments]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to upload file(s). Large or unsupported file formats detected.");
    }

    e.target.value = "";
    setIsAttachmentMenuOpen(false);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setSelectedAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };
  const deletedChatIdsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isGenerating]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  const limits = {
    Free: { academic: 20, nonAcademic: 15 },
    "Pro IV": { academic: 40, nonAcademic: 30 },
    "Pro V": { academic: Infinity, nonAcademic: Infinity }
  };

  useEffect(() => {
    if (!user) return;
    
    const chatsPath = `users/${user.uid}/chats`;
    const chatsRef = collection(db, "users", user.uid, "chats");
    const q = query(chatsRef, orderBy("updatedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList: ChatSession[] = [];
      snapshot.forEach((snapDoc) => {
        const item = snapDoc.data() as ChatSession;
        if (item.mode === mode && !deletedChatIdsRef.current.has(item.id)) {
          chatList.push(item);
        }
      });
      setChats(chatList);
      
      if (chatList.length > 0 && !selectedChatId) {
        setSelectedChatId(chatList[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, chatsPath);
    });

    return () => unsubscribe();
  }, [user, mode]);

  useEffect(() => {
    if (!user || !selectedChatId) {
      setMessages([]);
      setActiveChat(null);
      return;
    }

    const chatDocRef = doc(db, "users", user.uid, "chats", selectedChatId);
    const messagesRef = collection(db, "users", user.uid, "chats", selectedChatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubMeta = onSnapshot(chatDocRef, (snap) => {
      if (snap.exists()) {
        setActiveChat(snap.data() as ChatSession);
      }
    });

    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgList: ChatMessage[] = [];
      snapshot.forEach((msgDoc) => {
        msgList.push(msgDoc.data() as ChatMessage);
      });
      setMessages(msgList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/chats/${selectedChatId}/messages`);
    });

    setTimeout(() => scrollToBottom("auto"), 55);

    return () => {
      unsubMeta();
      unsubMessages();
    };
  }, [user, selectedChatId]);

  const handleAddNewChat = async () => {
    if (!user) return;
    
    const newChatId = `chat_${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: "New Conversation",
      mode: mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const path = `users/${user.uid}/chats/${newChatId}`;
    try {
      await setDoc(doc(db, "users", user.uid, "chats", newChatId), newChat);
      setSelectedChatId(newChatId);
      setIsMobileDrawerOpen(false);
      setInputValue("");
      setError("");
      if (textareaRef.current) textareaRef.current.focus();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(chatId);
  };

  const executeDeleteChat = async (chatId: string) => {
    if (!user) return;
    const chatPath = `users/${user.uid}/chats/${chatId}`;
    try {
      // Record this chat ID as immediately deleted in local ref
      deletedChatIdsRef.current.add(chatId);
      
      // Compute the updated remaining chats state
      let remaining: ChatSession[] = [];
      setChats(prev => {
        remaining = prev.filter(c => c.id !== chatId);
        return remaining;
      });
      
      if (selectedChatId === chatId) {
        setSelectedChatId(remaining.length > 0 ? remaining[0].id : null);
      }
      setConfirmDeleteId(null);
      await deleteDoc(doc(db, "users", user.uid, "chats", chatId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, chatPath);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, chatId: string, currentPinStatus?: boolean) => {
    e.stopPropagation();
    if (!user) return;
    const chatPath = `users/${user.uid}/chats/${chatId}`;
    try {
      // Optimistically toggle pin status
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isPinned: !currentPinStatus } : c));
      await updateDoc(doc(db, "users", user.uid, "chats", chatId), {
        isPinned: !currentPinStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, chatPath);
    }
  };

  const handleSaveRename = async (chatId: string) => {
    if (!user) return;
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingChatId(null);
      return;
    }
    const chatPath = `users/${user.uid}/chats/${chatId}`;
    try {
      // Optimistically rename chat title
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: trimmed } : c));
      setEditingChatId(null);
      await updateDoc(doc(db, "users", user.uid, "chats", chatId), {
        title: trimmed,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, chatPath);
    }
  };

  const handleTriggerAITitle = async (e: React.MouseEvent, chatId: string, firstMsgText?: string) => {
    e.stopPropagation();
    if (!user) return;

    let textToAnalyze = firstMsgText || "";
    if (!textToAnalyze && selectedChatId === chatId && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === "user");
      if (firstUserMsg) {
        textToAnalyze = firstUserMsg.content;
      }
    }

    if (!textToAnalyze.trim()) return;

    setIsGeneratingTitleId(chatId);
    try {
      const res = await fetch("/api/gemini/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstMessage: textToAnalyze }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          // Optimistically rename chat title
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: data.title } : c));
          await updateDoc(doc(db, "users", user.uid, "chats", chatId), {
            title: data.title,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("AI Title generation failure:", err);
    } finally {
      setIsGeneratingTitleId(null);
    }
  };

  const generateAndApplyAITitle = async (chatId: string, firstMessageText: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/gemini/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstMessage: firstMessageText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          await updateDoc(doc(db, "users", user.uid, "chats", chatId), {
            title: data.title,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error("Async AI title worker failed:", e);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/login");
  };

  const generateCleanTitle = (prompt: string): string => {
    if (!prompt) return "New Conversation";
    
    let text = prompt.trim();
    
    // Remove markdown, LaTeX or special characters
    text = text.replace(/[$#`*_\(\)\[\]\{\}\\\/]/g, "");
    
    // Core patterns: scan for common user query starters and strip them
    const patternsToStrip = [
      /^(please\s+)?explain(\s+to\s+me)?\s+what\s+is\s+/i,
      /^(please\s+)?explain(\s+to\s+me)?\s+the\s+difference\s+between\s+/i,
      /^(please\s+)?explain(\s+to\s+me)?\s+how\s+to\s+/i,
      /^(please\s+)?explain(\s+to\s+me)?\s+/i,
      /^(please\s+)?how\s+do\s+i\s+/i,
      /^(please\s+)?how\s+can\s+i\s+/i,
      /^(please\s+)?how\s+to\s+/i,
      /^(please\s+)?what\s+is\s+the\s+difference\s+between\s+/i,
      /^(please\s+)?what\s+is\s+a\s+/i,
      /^(please\s+)?what\s+is\s+the\s+/i,
      /^(please\s+)?what\s+is\s+/i,
      /^(please\s+)?what\s+are\s+the\s+/i,
      /^(please\s+)?what\s+are\s+/i,
      /^(please\s+)?tell\s+me\s+about\s+/i,
      /^(please\s+)?write\s+a\s+code\s+for\s+/i,
      /^(please\s+)?write\s+a\s+program\s+for\s+/i,
      /^(please\s+)?write\s+a\s+program\s+to\s+/i,
      /^(please\s+)?write\s+a\s+/i,
      /^(please\s+)?solve\s+/i,
      /^(please\s+)?define\s+/i,
      /^(please\s+)?summarize\s+/i,
      /^(please\s+)?give\s+me\s+examples\s+of\s+/i,
      /^(please\s+)?give\s+me\s+/i,
    ];
    
    let matchFound = true;
    while (matchFound) {
      matchFound = false;
      for (const pattern of patternsToStrip) {
        if (pattern.test(text)) {
          text = text.replace(pattern, "");
          matchFound = true;
        }
      }
    }
    
    // Remove punctuation marks or trailing colons
    text = text.replace(/[?.,!;:]+$/g, "").trim();
    
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "New Conversation";
    
    const maxWords = 5;
    const pickedWords = words.slice(0, maxWords);
    
    const capitalized = pickedWords.map(w => {
      const lower = w.toLowerCase();
      const smalls = ["and", "or", "of", "with", "to", "in", "on", "a", "an", "the", "for", "by", "as", "at"];
      if (smalls.includes(lower)) return lower;
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
    
    if (capitalized[0]) {
      capitalized[0] = capitalized[0].charAt(0).toUpperCase() + capitalized[0].slice(1);
    }
    
    let cleanTitle = capitalized.join(" ");
    if (words.length > maxWords) {
      cleanTitle += "...";
    }
    
    if (cleanTitle.length > 28) {
      cleanTitle = cleanTitle.substring(0, 25) + "...";
    }
    
    return cleanTitle;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || isGenerating) return;
    if (!inputValue.trim() && selectedAttachments.length === 0) return;

    const currentText = inputValue;
    const currentAttachments = [...selectedAttachments];

    setError("");

    let targetChatId = selectedChatId;
    if (!targetChatId) {
      const brandNewId = `chat_${Date.now()}`;
      const defaultTitle = currentText.trim() 
        ? generateCleanTitle(currentText) 
        : currentAttachments[0]?.name || "Attached File";
      const brandNew: ChatSession = {
        id: brandNewId,
        title: defaultTitle,
        mode: mode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const path = `users/${user.uid}/chats/${brandNewId}`;
      try {
        await setDoc(doc(db, "users", user.uid, "chats", brandNewId), brandNew);
        setSelectedChatId(brandNewId);
        targetChatId = brandNewId;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
        return;
      }
    }

    const currentLimits = limits[profile.subscriptionPlan];
    const currentUsageCount = mode === "academic" ? profile.academicUsageCount : profile.nonAcademicUsageCount;
    const allowedLimit = mode === "academic" ? currentLimits.academic : currentLimits.nonAcademic;

    if (currentUsageCount >= allowedLimit) {
      navigate("/limit-reached");
      return;
    }

    const userMessageId = `msg_${Date.now()}_u`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: currentText,
      createdAt: new Date().toISOString(),
      ...(currentAttachments.length > 0 ? { attachments: currentAttachments } : {})
    };

    const userMessagePath = `users/${user.uid}/chats/${targetChatId}/messages/${userMessageId}`;
    try {
      await setDoc(doc(db, "users", user.uid, "chats", targetChatId, "messages", userMessageId), userMsg);
      const activeTitle = chats.find(c => c.id === targetChatId)?.title || "New Conversation";
      if (activeTitle === "New Conversation" || activeTitle === "New chat") {
        const titleToSet = currentText.trim() 
          ? generateCleanTitle(currentText) 
          : currentAttachments[0]?.name || "Attached File";
        await updateDoc(doc(db, "users", user.uid, "chats", targetChatId), {
          title: titleToSet,
          updatedAt: new Date().toISOString()
        });
        if (currentText.trim()) {
          generateAndApplyAITitle(targetChatId, currentText);
        }
      } else {
        await updateDoc(doc(db, "users", user.uid, "chats", targetChatId), {
          updatedAt: new Date().toISOString()
        });
      }

      // STATE CLEARED ONLY AFTER SUCCESSFUL SEND (Requirements 4, 5)
      setInputValue("");
      setSelectedAttachments([]);
    } catch (err) {
      console.error("Failed to save message to Firestore:", err);
      setError("Failed to send message. Please ensure the image size is under the limits and try again.");
      handleFirestoreError(err, OperationType.CREATE, userMessagePath);
      return;
    }

    await incrementUsage(mode);

    setIsGenerating(true);
    setStreamingText("");

    const systemInstruction = mode === "academic"
      ? "You are Dolver AI, an advanced AI assistant designed for students and general users.\n" +
        "You are currently operating in ACADEMIC MODE, which is activated for study, school subjects, exams, explanations, homework, concepts, and school-related topics.\n\n" +
        "CORE PERSPECTIVE & CHARACTER:\n" +
        "- Maintain a highly supportive, engaging, and professional teaching tone.\n" +
        "- Act smart, friendly, conversational, and natural, NOT robotic or like an automated textbook generator.\n\n" +
        "RESPONSE STYLE CONTROL:\n" +
        "Detect if the user explicitly or implicitly requests a response style, and adapt your response style strictly to what is requested:\n" +
        "- \"short\": Give a very brief and direct answer (2-6 lines max, no headings/lists).\n" +
        "- \"detailed\": Provide a deep explanation with complete step-by-step clarity.\n" +
        "- \"exam-ready\": Provide a highly structured answer with definitions, core points, and clear conclusions suitable for writing in exams.\n" +
        "- \"simple\": Provide a very easy, clear, beginner-friendly explanation using analogies.\n\n" +
        "PERSONALITY MODES:\n" +
        "Detect if the user requests or expects a specific personality style, or default to the appropriate one:\n" +
        "- \"teacher mode\": Structured, educational, detailed explanations, breaking down complex topics.\n" +
        "- \"friend mode\": Casual, warm, simple, conversational tone.\n" +
        "- \"expert mode\": Advanced, technical, precise and highly accurate explanations.\n\n" +
        "ACADEMIC MODE EXCLUSIVE RULES:\n" +
        "- Provide structured explanations using headings and bullet points.\n" +
        "- Break complex topics into clear steps.\n" +
        "- Include illustrative examples when helpful.\n" +
        "- Always start with a short, direct, clear answer first to avoid overwhelming the student.\n" +
        "- Never automatically assume a question needs a full lecture series, long history notes, programming code blocks, or huge tables unless explicitly requested.\n" +
        "- Wrap LaTeX equations in $$ equation $$ and inline math variables in $ symbol $ to guarantee beautiful visual math rendering.\n\n" +
        "MEMORY BEHAVIOR (SESSION-BASED):\n" +
        "- Remember user preferences within the current conversation such as preferred style (e.g., short, detailed, exam-ready), personality modes, and topics discussed.\n" +
        "- Use remembered preferences naturally in responses. Do not claim permanent memory unless explicitly supported by system.\n\n" +
        "ADVANCED CAPABILITIES HANDLING:\n" +
        "- If user provides text, document, or file content, summarize and explain clearly.\n" +
        "- If image input is provided, analyze and describe it accurately.\n" +
        "- If voice input is used, ensure responses are clear, highly readable, and optimized for speech output.\n\n" +
        "PERFORMANCE RULES:\n" +
        "- Prioritize absolute clarity and correctness.\n" +
        "- For simple questions, respond directly without unnecessary explanation.\n" +
        "- For complex questions, break into steps.\n" +
        "- If uncertain, clearly state limitations instead of guessing.\n\n" +
        "SAFETY RULES:\n" +
        "- Do not provide harmful, illegal, or unsafe instructions.\n" +
        "- Do not assist in wrongdoing or privacy violations.\n" +
        "- Ensure content is appropriate for student usage.\n\n" +
        "OUTPUT STYLE:\n" +
        "- Use clean formatting with headings and bullet points when needed.\n" +
        "- Keep responses organized and easy to read.\n" +
        "- Avoid unnecessary long paragraphs unless requested.\n" +
        "- Do not start answers with conversational boilerplate greetings/fillers like: \"Certainly!\", \"Sure, I can help you with that!\", \"As an AI...\". Get straight to the text."
      : "You are Dolver AI, an advanced AI assistant designed for students and general users.\n" +
        "You are currently operating in NON-ACADEMIC MODE, which is activated for casual conversation, coding help, ideas, general discussion, and creativity.\n\n" +
        "CORE PERSPECTIVE & CHARACTER:\n" +
        "- Be natural, warm, highly conversational, and helpful (similar to how ChatGPT communicates).\n" +
        "- Avoid robotic textbook-style behaviors. Keep the tone friendly, practical, and human-like.\n\n" +
        "RESPONSE STYLE CONTROL:\n" +
        "Detect if the user explicitly or implicitly requests a response style, and adapt your response style strictly to what is requested:\n" +
        "- \"short\": Give a very brief and direct answer (2-6 lines max, no headings/lists).\n" +
        "- \"detailed\": Provide deep details, clear breakdown, and code comments if programming.\n" +
        "- \"exam-ready\": Structured, professional answer.\n" +
        "- \"simple\": Extremely easy, beginner-friendly explanation.\n\n" +
        "PERSONALITY MODES:\n" +
        "Detect if the user requests or expects a specific personality style, or default to the appropriate one:\n" +
        "- \"teacher mode\": Educational explanation done casually.\n" +
        "- \"friend mode\": Very casual, friendly, conversational, and direct.\n" +
        "- \"expert mode\": Advanced, technical precision, high-quality code snippets, or productivity tips.\n\n" +
        "NON-ACADEMIC MODE EXCLUSIVE RULES:\n" +
        "- Allow brainstorming, coding help, and general discussion in a highly natural flow.\n" +
        "- Keep explanations clear and concise, using very light markdown.\n" +
        "- For coding help: highlight syntaxes, write clean commentaries, and make code snippets copy-friendly.\n\n" +
        "MEMORY BEHAVIOR (SESSION-BASED):\n" +
        "- Remember user preferences within the current conversation such as preferred style (e.g., short, detailed, exam-ready), personality modes, and topics discussed.\n" +
        "- Use remembered preferences naturally in responses. Do not claim permanent memory unless explicitly supported by system.\n\n" +
        "ADVANCED CAPABILITIES HANDLING:\n" +
        "- If user provides text, document, or file content, summarize and explain clearly.\n" +
        "- If image input is provided, analyze and describe it accurately.\n" +
        "- If voice input is used, ensure responses are clear, highly readable, and optimized for speech output.\n\n" +
        "PERFORMANCE RULES:\n" +
        "- Prioritize absolute clarity and correctness.\n" +
        "- For simple questions or chitchat, respond directly in 2 to 6 lines maximum without giant sections, lists, headings, code blocks, or tables.\n" +
        "- If uncertain, clearly state limitations instead of guessing.\n\n" +
        "SAFETY RULES:\n" +
        "- Do not provide harmful, illegal, or unsafe instructions.\n" +
        "- Do not assist in wrongdoing or privacy violations.\n" +
        "- Ensure content is appropriate for student usage.\n\n" +
        "OUTPUT STYLE:\n" +
        "- Use clean formatting with headings and bullet points when needed.\n" +
        "- Keep responses organized and easy to read.\n" +
        "- Avoid unnecessary long paragraphs unless requested.\n" +
        "- Do not start answers with conversational boilerplate greetings/fillers like: \"Certainly!\", \"Sure, I can help you with that!\", \"As an AI...\". Get straight to the text.";

    const fullPromptHistory = [...messages, userMsg].filter(m => m.role === "user" || m.role === "assistant").slice(-10);

    try {
      const result = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullPromptHistory,
          systemInstruction,
          model: "gemini-3.5-flash"
        }),
      });

      if (!result.ok) {
        let errMsg = "Chat fetch execution failed.";
        try {
          const errData = await result.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = result.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedReply = "";

      if (!reader) {
        throw new Error("Decoder channel unreadable.");
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedReply += parsed.text;
                setStreamingText(accumulatedReply);
              }
            } catch (pErr) {
              // Ignore partial JSON parsing buffers
            }
          }
        }
      }

      if (accumulatedReply.trim()) {
        const aiMessageId = `msg_${Date.now()}_a`;
        const aiMsg: ChatMessage = {
          id: aiMessageId,
          role: "assistant",
          content: accumulatedReply,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid, "chats", targetChatId, "messages", aiMessageId), aiMsg);
        await new Promise(r => setTimeout(r, 200));
      }

    } catch (error: any) {
      console.error(error);
      setError(error.message || "An error occurred during response synthesis. Please try re-sending.");
    } finally {
      setIsGenerating(false);
      setStreamingText("");
    }
  };

  const placeholderText = mode === "academic" 
    ? "Ask an academic question..." 
    : "Message Dolver AI...";

  const filteredMessages = messages.filter(m => m.role === "user" || m.role === "assistant");

  // Filter and sort the conversations feed based on search queries and pinned status
  const getProcessedChats = () => {
    let list = chats;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => c.title.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      const aPinned = !!a.isPinned;
      const bPinned = !!b.isPinned;

      // Pinned chats always rise to the top of the list
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Secondary ordering based on chronological sort selection
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();

      if (sortOrder === "recent") {
        return timeB - timeA; // Newest / most recently updated first
      } else {
        return timeA - timeB; // Oldest first
      }
    });
  };

  // Soft ChatGPT style sidebar rendering
  const SidebarContent = () => {
    const processedChats = getProcessedChats();

    return (
      <div className="flex flex-col h-full bg-[#f9f9f9] dark:bg-gpt-dark-panel text-[#202123] dark:text-gpt-dark-text-primary">
        
        {/* Sidebar Branding Header */}
        <div className="px-4 py-3.5 border-b border-gpt-light-border dark:border-gpt-dark-border flex items-center gap-2 select-none flex-shrink-0 bg-[#f9f9f9] dark:bg-[#1a1a1c]/40 transition-colors duration-200">
          <Logo size="md" className="cursor-pointer" onClick={() => navigate("/")} />
        </div>

        {/* Sidebar Header Wrapper */}
        <div className="p-3.5 flex justify-between items-center bg-[#f9f9f9] dark:bg-gpt-dark-panel border-b border-gpt-light-border dark:border-gpt-dark-border flex-shrink-0">
          <button
            onClick={handleAddNewChat}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#202123] hover:bg-black/5 dark:text-white dark:hover:bg-[#202020] rounded-lg cursor-pointer transition-colors active:scale-98"
          >
            <span className="font-bold">New chat</span>
            <Plus className="h-4 w-4 text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary" />
          </button>
        </div>

        {/* Search and Sort controls */}
        <div className="px-3.5 py-2 flex flex-col gap-2 border-b border-gpt-light-border dark:border-gpt-dark-border bg-[#f6f6f6]/60 dark:bg-[#1a1a1c]/40 flex-shrink-0">
          
          {/* Inner Search Container */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-[#7A7A7A]" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-[#151516] border border-gpt-light-border dark:border-gpt-dark-border rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-gpt-accent focus:border-gpt-accent transition-all leading-tight"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 dark:text-gpt-dark-text-muted cursor-pointer transition-colors"
                title="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Sort Ordering Toggle */}
          <div className="flex items-center justify-between text-[10px] text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary select-none font-sans px-0.5">
            <span className="font-bold text-slate-400 dark:text-gpt-dark-text-muted uppercase tracking-wider text-[9px]">History</span>
            <button
              onClick={() => setSortOrder(prev => prev === "recent" ? "oldest" : "recent")}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 font-bold text-gpt-accent dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
              title="Toggle chronological sort order"
            >
              <ArrowUpDown className="h-2.5 w-2.5" />
              <span className="capitalize">{sortOrder === "recent" ? "Recent First" : "Oldest First"}</span>
            </button>
          </div>
        </div>

        {/* Conversations feed */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {processedChats.length === 0 ? (
            <div className="text-center py-10 text-[11px] text-gpt-light-text-secondary dark:text-gpt-dark-text-muted px-4 leading-relaxed font-sans select-none">
              <p>{searchQuery ? "No matches found." : "No recent session guides."}</p>
              <p className="mt-1 text-[9px] text-slate-400 dark:text-[#7A7A7A]">
                {searchQuery ? "Try refining your search text." : "Chat prompt outputs save here."}
              </p>
            </div>
          ) : (
            processedChats.map((c) => {
              const isActive = selectedChatId === c.id;
              const isEditing = editingChatId === c.id;
              const isGeneratingTitle = isGeneratingTitleId === c.id;
              const isPinned = !!c.isPinned;

              if (isEditing) {
                return (
                  <div
                    key={c.id}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 p-1 px-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] mx-0.5 animate-fade-in duration-100"
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveRename(c.id);
                        } else if (e.key === "Escape") {
                          setEditingChatId(null);
                        }
                      }}
                      autoFocus
                      className="flex-1 text-xs min-w-0 px-1 bg-transparent border-0 text-[#202123] dark:text-white focus:outline-hidden text-left"
                    />
                    <button
                      onClick={() => handleSaveRename(c.id)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-emerald-600 dark:text-emerald-400 cursor-pointer transition-colors"
                      title="Save title"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setEditingChatId(null)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-rose-500 dark:text-rose-400 cursor-pointer transition-colors"
                      title="Cancel renaming"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedChatId(c.id);
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 px-2.5 rounded-lg cursor-pointer group transition-colors text-xs font-medium select-none ${
                    isActive 
                      ? "bg-black/5 text-[#202123] font-bold dark:bg-gpt-dark-bg dark:text-white" 
                      : "text-gpt-light-text-secondary dark:text-[#A9A9A9] hover:bg-black/5 dark:hover:bg-[#202020] hover:text-[#202123] dark:hover:text-white"
                  }`}
                >
                  {/* Title and Pin icons label container */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {isPinned && (
                      <Pin className="h-3 w-3 text-gpt-accent flex-shrink-0 transform rotate-45" />
                    )}
                    <span className="truncate pr-1 leading-tight text-left">
                      {c.title}
                    </span>
                  </div>

                  {/* Context hover buttons */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ml-1.5 flex-shrink-0">
                    
                    {/* Pin button */}
                    <button
                      onClick={(e) => handleTogglePin(e, c.id, isPinned)}
                      className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                        isPinned 
                          ? "text-gpt-accent" 
                          : "text-slate-400 hover:text-[#202123] dark:text-[#7A7A7A] dark:hover:text-white"
                      }`}
                      title={isPinned ? "Unpin chat" : "Pin chat to top"}
                    >
                      <Pin className="h-3 w-3" />
                    </button>

                    {/* AI smart title sparkler */}
                    <button
                      onClick={(e) => handleTriggerAITitle(e, c.id)}
                      disabled={isGeneratingTitle}
                      className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer transition-colors ${
                        isGeneratingTitle ? "animate-pulse" : ""
                      }`}
                      title="Generate AI title"
                    >
                      <Sparkles className="h-3 w-3" />
                    </button>

                    {/* Manual renaming trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChatId(c.id);
                        setEditingTitle(c.title);
                      }}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-[#202123] dark:text-[#7A7A7A] dark:hover:text-white cursor-pointer transition-colors"
                      title="Rename inline"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>

                    {/* Safe delete button */}
                    <button
                      onClick={(e) => handleDeleteChat(e, c.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:text-[#7A7A7A] dark:hover:text-red-400 cursor-pointer transition-colors"
                      title="Delete Conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Profil and Anchor Hub Footer */}
        {profile && (
          <div className="border-t border-gpt-light-border dark:border-gpt-dark-border bg-[#f9f9f9] dark:bg-[#1a1a1b] p-3 flex flex-col gap-2 flex-shrink-0">
            
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-[#202020] cursor-pointer transition-colors group text-left"
            >
              <div className="relative flex-shrink-0 h-8 w-8 rounded-full border border-gpt-light-border dark:border-gpt-dark-border overflow-hidden">
                <img 
                  src={profile.avatar} 
                  alt="Me" 
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#202123] dark:text-white leading-none truncate">{profile.name}</p>
                <p className="text-[10px] text-gpt-light-text-secondary dark:text-[#7A7A7A] mt-0.5 truncate uppercase tracking-widest font-bold">
                  {profile.subscriptionPlan} Plan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-[#ffffff] dark:bg-gpt-dark-bg rounded border border-gpt-light-border dark:border-gpt-dark-border select-none">
              <button
                onClick={() => navigate("/")}
                className="p-1.5 rounded hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2c] text-gpt-light-text-secondary dark:text-[#A9A9A9] hover:text-[#202123] dark:hover:text-white cursor-pointer flex items-center justify-center transition-all"
                title="Dashboard Home"
              >
                <Home className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-1.5 rounded hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2c] text-gpt-light-text-secondary dark:text-[#A9A9A9] hover:text-[#202123] dark:hover:text-white cursor-pointer flex items-center justify-center transition-all"
                title="Profile Settings"
              >
                <UserSquare2 className="h-4 w-4" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2c] text-gpt-light-text-secondary dark:text-[#A9A9A9] hover:text-[#202123] dark:hover:text-white cursor-pointer flex items-center justify-center transition-all"
                title="Toggle system theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 rounded hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2c] text-gpt-light-text-secondary dark:text-[#A9A9A9] hover:text-red-500 dark:hover:text-red-400 cursor-pointer flex items-center justify-center transition-all"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    );
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#ffffff] dark:bg-gpt-dark-bg text-[#202123] dark:text-gpt-dark-text-primary transition-colors duration-200 font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col border-r border-gpt-light-border dark:border-gpt-dark-border h-full transition-all duration-200 z-20 ${
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <div className="h-full w-64 flex-shrink-0 flex flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex animate-fade-in duration-100">
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-150"
          />
          <aside className="relative z-50 h-full w-64 border-r border-gpt-light-border dark:border-gpt-dark-border flex flex-col animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* MAIN CHAT AREA */}
      <section className="flex-1 flex flex-col min-w-0 h-full relative bg-[#ffffff] dark:bg-gpt-dark-bg">
        
        {/* Flat Subtle Top Header */}
        <div className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-gpt-light-border dark:border-gpt-dark-border bg-[#ffffff]/80 dark:bg-gpt-dark-bg/85 backdrop-blur-md z-10 flex-shrink-0 select-none">
          <div className="flex items-center gap-2">
            
            {/* Mobile drawer click */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-1.5 text-gpt-light-text-secondary hover:text-[#202123] dark:text-gpt-dark-text-secondary dark:hover:text-white rounded md:hidden cursor-pointer"
              title="Open History"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Desktop toggle slider */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-1.5 text-gpt-light-text-secondary hover:text-[#202123] dark:text-gpt-dark-text-secondary dark:hover:text-white rounded cursor-pointer transition-colors"
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <ArrowLeft className={`h-4 w-4 transform transition-transform duration-200 ${isSidebarOpen ? "" : "rotate-180"}`} />
            </button>

            {/* Title indicator label */}
            <div className="flex items-center gap-2">
              {mode === "academic" ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7f7f8] dark:bg-gpt-dark-card border border-gpt-light-border dark:border-gpt-dark-border">
                  <GraduationCap className="h-3.5 w-3.5 text-gpt-accent dark:text-blue-400" />
                  <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary">Academic mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7f7f8] dark:bg-gpt-dark-card border border-gpt-light-border dark:border-gpt-dark-border">
                  <Compass className="h-3.5 w-3.5 text-gpt-accent dark:text-blue-400" />
                  <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary">General assist</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick status counter limits */}
          {profile && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary bg-[#f7f7f8] dark:bg-gpt-dark-card border border-gpt-light-border dark:border-gpt-dark-border py-1 px-2.5 rounded-lg select-none">
              LIMIT: {mode === "academic" ? profile.academicUsageCount : profile.nonAcademicUsageCount}/{limits[profile.subscriptionPlan][mode === "academic" ? "academic" : "nonAcademic"] === Infinity ? "∞" : limits[profile.subscriptionPlan][mode === "academic" ? "academic" : "nonAcademic"]}
            </div>
          )}
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 flex flex-col items-center">
          <div className="w-full max-w-2xl space-y-8 flex flex-col">
            
            {/* Elegant Landing Card when Conversation is completely empty */}
            {filteredMessages.length === 0 && !isGenerating && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in select-none">
                <div className="h-14 w-14 rounded-full bg-[#f7f7f8] dark:bg-gpt-dark-card border border-gpt-light-border dark:border-gpt-dark-border flex items-center justify-center shadow-xs text-gpt-accent dark:text-blue-400">
                  {mode === "academic" ? <GraduationCap className="h-6 w-6" /> : <Compass className="h-6 w-6" />}
                </div>
                <div className="space-y-2.5 max-w-md">
                  <h3 className="text-xl font-bold tracking-tight text-[#202123] dark:text-white">
                    {mode === "academic" ? "Academic doubt solver" : "Dolver AI assistant"}
                  </h3>
                  <p className="text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed px-4">
                    {mode === "academic"
                      ? "Submit step-by-step academic questions. Expect clean proofs, advanced LaTeX formula representations, clean programming comment notes, and clear derivations."
                      : "Brainstorm outlines, draft structures, write clean software snippets, organize workflows, and receive help in a distraction-free pane."}
                  </p>
                </div>
              </div>
            )}

            {/* Error notifications */}
            {errorHeader && (
              <div className="p-3.5 text-xs text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-300 rounded-lg border border-red-200/50 dark:border-red-900/40 flex items-center gap-1.5 animate-fade-in leading-relaxed">
                <span>⚠️ {errorHeader}</span>
              </div>
            )}

            {/* MESSAGE LIST RENDER PIPELINE */}
            {filteredMessages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div 
                  key={m.id}
                  className="w-full animate-fade-in"
                >
                  {isUser ? (
                    /* User message aligns tightly as an elegant right-bubble container */
                    <div className="flex flex-col items-end w-full gap-1 mb-3">
                      <div className="bg-[#f4f4f4] dark:bg-gpt-dark-card text-[#202123] dark:text-[#ECECEC] rounded-2xl px-5 py-2.5 max-w-[75%] leading-relaxed select-text text-[15px] flex flex-col gap-3">
                        {/* Display images first (image on top) */}
                        {m.attachments && m.attachments.filter((att: any) => att.type.startsWith("image/")).length > 0 && (
                          <div className="flex flex-col gap-2 w-full">
                            {m.attachments.filter((att: any) => att.type.startsWith("image/")).map((att: any, idx: number) => (
                              <div key={idx} className="relative group w-full max-w-[320px] max-h-[240px] overflow-hidden rounded-xl border border-black/10 dark:border-white/10 shadow-xs hover:border-black/20 dark:hover:border-white/20 transition-all">
                                <img 
                                  src={att.url} 
                                  alt={att.name || "Attachment"} 
                                  referrerPolicy="no-referrer"
                                  className="w-full max-h-[240px] object-cover rounded-xl cursor-pointer transition-transform group-hover:scale-[1.01]"
                                  onClick={() => {
                                    const newTab = window.open();
                                    if (newTab) {
                                      newTab.document.write(`<img src="${att.url}" style="max-width:100%; max-height:100%; display:block; margin:auto;"/>`);
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text Message content underneath */}
                        {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}

                        {/* Non-image attachments at the very bottom */}
                        {m.attachments && m.attachments.filter((att: any) => !att.type.startsWith("image/")).length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end mt-1">
                            {m.attachments.filter((att: any) => !att.type.startsWith("image/")).map((att: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="flex items-center gap-2 p-2 bg-white/40 dark:bg-black/45 border border-black/5 dark:border-white/5 rounded-lg max-w-sm select-none hover:bg-white/60 dark:hover:bg-black/60 transition-colors"
                              >
                                <div className="p-1.5 rounded-md bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
                                  <File className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="text-xs font-semibold truncate text-[#202123] dark:text-white max-w-[120px]">{att.name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                                    {(att.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User message copy button */}
                      {m.content && (
                        <div className="flex items-center mr-2">
                          <button
                            onClick={() => handleCopyMessage(m.id, m.content)}
                            className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer select-none"
                            title="Copy message"
                          >
                            {copiedMessageId === m.id ? (
                              <>
                                <Check className="h-3 w-3 text-green-500" />
                                <span className="text-green-500 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Assistant message takes full reading width center flat */
                    <div className="flex gap-4 w-full justify-start items-start py-1 mb-4">
                      <div className="flex-shrink-0 h-6.5 w-6.5 rounded-full select-none bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white flex items-center justify-center font-bold text-[10px] mt-0.5 shadow-sm">
                        D
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5 select-text overflow-hidden pl-1">
                        <FormattedMessage content={m.content} />

                        {/* Assistant message copy button */}
                        {m.content && (
                          <div className="flex items-center">
                            <button
                              onClick={() => handleCopyMessage(m.id, m.content)}
                              className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer select-none"
                              title="Copy response"
                            >
                              {copiedMessageId === m.id ? (
                                <>
                                  <Check className="h-3 w-3 text-green-500" />
                                  <span className="text-green-500 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Streaming Message Tokens */}
            {isGenerating && streamingText && (
              <div className="w-full animate-fade-in flex gap-4 justify-start items-start py-1">
                <div className="flex-shrink-0 h-6.5 w-6.5 rounded-full select-none bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white flex items-center justify-center font-bold text-[10px] mt-0.5 shadow-sm">
                  D
                </div>
                <div className="flex-1 select-text overflow-hidden pl-1 relative">
                  <FormattedMessage content={streamingText} />
                  <span className="inline-block w-1 h-3.5 bg-gpt-accent animate-pulse ml-1 align-middle rounded-full" />
                </div>
              </div>
            )}

            {/* Waiting AI Trigger Dots indicator */}
            {isGenerating && !streamingText && (
              <div className="w-full animate-fade-in flex gap-4 justify-start items-start py-1">
                <div className="flex-shrink-0 h-6.5 w-6.5 rounded-full select-none bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white flex items-center justify-center font-bold text-[10px] mt-0.5 shadow-sm">
                  D
                </div>
                
                <div className="px-4 py-2.5 rounded-xl bg-[#f4f4f4] dark:bg-gpt-dark-card flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-gpt-accent animate-typing-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gpt-accent animate-typing-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gpt-accent animate-typing-3" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2 flex-shrink-0" />
          </div>
        </div>

        {/* Dynamic, Floating Input Sticky Box bottom footer */}
        <div className="bg-transparent px-4 pb-6 pt-2 md:px-6 flex flex-col items-center justify-center flex-shrink-0 z-10 w-full select-none">
          
          <form 
            onSubmit={handleSendMessage} 
            className="w-full max-w-2xl flex flex-col gap-2 bg-white dark:bg-[#2a2a2a] border border-black/[0.08] dark:border-white/[0.08] rounded-[26px] px-4 py-2.5 transition-all duration-150 focus-within:border-black/20 dark:focus-within:border-white/20 focus-within:ring-1 focus-within:ring-[#A9A9A9]/20 shadow-xs"
          >
            {/* Attachment Preview Row */}
            {selectedAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.04] w-full animate-fade-in">
                {selectedAttachments.map((att, idx) => {
                  const isImg = att.type.startsWith("image/");
                  return (
                    <div 
                      key={idx} 
                      className="relative flex items-center gap-2 p-1.5 bg-[#f7f7f8] dark:bg-[#1a1a1c] border border-black/[0.05] dark:border-white/[0.05] rounded-xl group/preview max-w-[180px] pr-8 text-left animate-fade-in"
                    >
                      {isImg ? (
                        <img 
                          src={att.url} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 object-cover rounded-md flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                      )}
                      
                      <div className="min-w-0 pr-1">
                        <p className="text-[11px] font-semibold truncate text-[#202123] dark:text-white leading-tight">
                          {att.name}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                          {(att.size / 1024).toFixed(0)} KB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-[#202123] dark:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Row Input Controls */}
            <div className="flex items-end gap-2 w-full relative">
              
              {/* Attachment Triggers & Dropdown Container */}
              <div ref={attachmentMenuRef} className="relative flex-shrink-0 leading-none pb-0.5">
                <button
                  type="button"
                  onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                  className={`p-1 rounded-full transition-all duration-150 cursor-pointer h-7 w-7 flex items-center justify-center ${
                    isAttachmentMenuOpen 
                      ? "bg-gpt-accent text-white rotate-45 shadow-xs" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-gpt-accent/10 hover:text-gpt-accent dark:hover:bg-blue-400/10 dark:hover:text-blue-400 active:scale-95"
                  }`}
                  title="Add attachment"
                >
                  <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>

                {/* Dropdown Menu */}
                {isAttachmentMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-3 bg-white dark:bg-[#1f1f20] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl w-44 py-1.5 z-50 text-left animate-fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition-colors"
                    >
                      <Image className="h-4 w-4 text-slate-400 dark:text-blue-400 flex-shrink-0 transition-colors" />
                      <span>Upload Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition-colors"
                    >
                      <FileText className="h-4 w-4 text-slate-400 dark:text-blue-400 flex-shrink-0 transition-colors" />
                      <span>Upload File / Doc</span>
                    </button>
                  </div>
                )}

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={(e) => handleFileChange(e, "image")}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e, "all")}
                  accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,text/plain"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={placeholderText}
                rows={1}
                className="flex-1 max-h-36 min-h-[22px] resize-none bg-transparent outline-none border-none py-1.5 px-0.5 font-sans text-sm text-[#202123] dark:text-[#ECECEC] placeholder-[#6b7280] dark:placeholder-[#8e8ea0] caret-[#202123] dark:caret-[#ECECEC] focus:ring-0 focus:outline-none leading-relaxed selection:bg-black/10 dark:selection:bg-white/20"
              />
              
              {/* Send Button */}
              <button
                type="submit"
                disabled={isGenerating || (!inputValue.trim() && selectedAttachments.length === 0)}
                className="p-1 px-1.5 rounded-full bg-gpt-accent text-white h-7 w-7 flex items-center justify-center transition-all duration-150 disabled:bg-gpt-accent/30 disabled:text-white/40 cursor-pointer flex-shrink-0 scale-100 hover:scale-[1.02]"
                title="Generate Reply"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
          
          <p className="text-[10px] text-gpt-light-text-secondary dark:text-gpt-dark-text-muted mt-2 text-center select-none leading-tight hover:text-gpt-accent transition-colors">
            Dolver AI preserves step-by-step academic proofs and LaTeX derivations in full.
          </p>
        </div>

      </section>

      {/* Profile Drawer */}
      {isProfileOpen && (
        <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      )}

      {/* Confirmation Sign-out Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in duration-100">
          <div className="w-full max-w-xs rounded-xl border border-gpt-light-border dark:border-gpt-dark-border bg-white p-6 shadow-2xl dark:bg-gpt-dark-card text-center">
            <h3 className="text-md font-bold text-[#202123] dark:text-white">
              Sign Out
            </h3>
            <p className="mt-1.5 text-xs text-gpt-light-text-secondary dark:text-gpt-dark-text-secondary leading-relaxed">
              Are you sure you want to exit your active workspace session on Dolver AI?
            </p>
            <div className="mt-5 flex justify-end gap-2 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-2 text-gpt-light-text-secondary hover:bg-black/5 rounded dark:text-gpt-dark-text-primary dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-3 py-2 text-white bg-gpt-accent hover:opacity-90 rounded cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Chat Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in duration-100">
          <div className="w-full max-w-sm rounded-xl border border-black/[0.04] dark:border-white/[0.04] bg-white p-5 shadow-2xl dark:bg-gpt-dark-card text-left">
            <div className="flex items-center gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/35 dark:text-red-400">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#202123] dark:text-white">
                  Delete conversation
                </h3>
                <p className="text-[10px] text-gpt-light-text-secondary dark:text-gpt-dark-text-muted">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="py-1">
              {(() => {
                const chatToDelete = chats.find(c => c.id === confirmDeleteId);
                return (
                  <p className="text-xs text-[#565869] dark:text-[#A9A9A9] leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-red-600 dark:text-red-400">“{chatToDelete?.title || "this conversation"}”</span>? This will erase all connected message history.
                  </p>
                );
              })()}
            </div>

            <div className="mt-5 flex justify-end gap-2 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-2 text-gpt-light-text-secondary hover:bg-black/5 rounded-lg dark:text-gpt-dark-text-primary dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDeleteId) {
                    executeDeleteChat(confirmDeleteId);
                  }
                }}
                className="px-3.5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
