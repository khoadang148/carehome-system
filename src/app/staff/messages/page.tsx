"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useChat } from '@/lib/contexts/chat-provider';
import { messagesAPI, userAPI, residentAPI } from '@/lib/api';
import {
	ChatBubbleLeftRightIcon,
	MagnifyingGlassIcon,
	PaperAirplaneIcon,
	ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import './messages.css';

interface Message {
	_id: string;
	sender_id: string | { _id: string; full_name: string; email: string };
	receiver_id: string | { _id: string; full_name: string; email: string };
	content: string;
	timestamp: string;
	read: boolean;
	resident_id?: string | { _id: string };
}

interface Conversation {
	_id: string | undefined;
	partner: {
		_id: string;
		full_name: string;
		email: string;
		avatar?: string;
	};
	lastMessage?: {
		content: string;
		timestamp: string;
		sender_id: string;
	};
	unreadCount: number;
}

// One row in the list: family + specific resident
interface ConversationEntry {
	key: string; // `${partnerId}-${residentId}`
	partner: Conversation['partner'];
	residentId: string;
	residentName: string;
	lastMessage?: Conversation['lastMessage'];
	unreadCount: number;
}

export default function StaffMessagesPage() {
	const router = useRouter();
	const { user } = useAuth();
	useChat(); // reserved for future unread updates

	// State
	const [conversations, setConversations] = useState<ConversationEntry[]>([]);
	const [selectedConversation, setSelectedConversation] = useState<ConversationEntry | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);

	// Fetch conversations and expand per resident
	const fetchConversations = async () => {
		try {
			const data = await messagesAPI.getConversations();
			const base: Conversation[] = Array.isArray(data) ? data : [];

			// Collect partner ids
			const partnerIds = Array.from(new Set(base.map((c) => c?.partner?._id).filter(Boolean)));

			const entries: ConversationEntry[] = [];
			for (const conv of base) {
				const partnerId = conv?.partner?._id;
				if (!partnerId) continue;
				try {
					const res = await residentAPI.getByFamilyMemberId(partnerId);
					const residents = Array.isArray(res) ? res : res ? [res] : [];
					if (residents.length === 0) {
						entries.push({
							key: `${partnerId}-unknown`,
							partner: conv.partner,
							residentId: '',
							residentName: '',
							lastMessage: conv.lastMessage,
							unreadCount: conv.unreadCount,
						});
						continue;
					}
					for (const r of residents) {
						entries.push({
							key: `${partnerId}-${r._id}`,
							partner: conv.partner,
							residentId: String(r._id),
							residentName: r.full_name || r.fullName || r.name || '',
							lastMessage: conv.lastMessage,
							unreadCount: conv.unreadCount,
						});
					}
				} catch {
					entries.push({
						key: `${partnerId}-unknown`,
						partner: conv.partner,
						residentId: '',
						residentName: '',
						lastMessage: conv.lastMessage,
						unreadCount: conv.unreadCount,
					});
				}
			}

			// Fetch messages once per family to know which residents actually have messages
			const partnerToMessages: Record<string, Message[]> = {};
			await Promise.all(
				Array.from(new Set(entries.map((e) => e.partner._id))).map(async (pid) => {
					try {
						const data = await messagesAPI.getConversation(pid);
						const arr = (Array.isArray(data) ? data : (data?.messages || [])) as Message[];
						partnerToMessages[pid] = arr;
					} catch {
						partnerToMessages[pid] = [];
					}
				})
			);

			const normalize = (m: Message) => {
				const rid = typeof m.resident_id === 'object' ? (m.resident_id as any)?._id : (m as any).resident_id;
				return { ...m, resident_id: rid } as any;
			};

			// Keep only entries that have at least one message for that resident
			const filteredEntries = entries
				.map((e) => {
					const msgs = (partnerToMessages[e.partner._id] || []).map(normalize);
					const ofResident = e.residentId
						? msgs.filter((m: any) => String(m.resident_id || '') === String(e.residentId))
						: msgs.filter((m: any) => !m.resident_id);
					// compute lastMessage and unreadCount for staff
					if (ofResident.length > 0) {
						ofResident.sort(
							(a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
						);
						const unread = ofResident.filter(
							(m: any) => (typeof m.receiver_id === 'string' ? m.receiver_id : (m.receiver_id as any)?._id) === user?.id && m.status !== 'read'
						).length;
						return {
							...e,
							lastMessage: {
								content: ofResident[0].content,
								timestamp: ofResident[0].timestamp,
								sender_id: typeof ofResident[0].sender_id === 'string' ? ofResident[0].sender_id : (ofResident[0].sender_id as any)?._id,
							},
							unreadCount: unread,
						};
					}
					return null;
				})
				.filter(Boolean) as ConversationEntry[];

			setConversations(filteredEntries);
		} catch (error) {
			console.error('Error fetching conversations:', error);
			setConversations([]);
		}
	};

	// Fetch messages for a selected (partner,resident)
	const fetchMessages = async (partnerId: string, residentId?: string) => {
		try {
			const data = await messagesAPI.getConversation(partnerId);
			const raw = (Array.isArray(data) ? data : (data?.messages || [])) as Message[];
			const normalized = raw.map((m) => ({
				...m,
				resident_id:
					typeof m.resident_id === 'object' && m.resident_id
						? (m.resident_id as any)._id
						: (m as any).resident_id,
			}));
			setMessages(
				residentId
					? normalized.filter((m) => String(m.resident_id || '') === String(residentId))
					: normalized
			);
		} catch (error) {
			console.error('Error fetching messages:', error);
			setMessages([]);
		}
	};

	// Send message
	const handleSendMessage = async () => {
		if (!newMessage.trim() || !selectedConversation || sending) return;

		setSending(true);
		try {
			const messageData: any = {
				receiver_id: selectedConversation.partner._id,
				content: newMessage.trim(),
			};
			if (selectedConversation.residentId) {
				messageData.resident_id = selectedConversation.residentId;
			}

			await messagesAPI.sendMessage(messageData);
			setNewMessage('');
			await fetchMessages(selectedConversation.partner._id, selectedConversation.residentId || undefined);
			await fetchConversations();
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			setSending(false);
		}
	};

	// Handle conversation selection
	const handleConversationSelect = async (conversation: ConversationEntry) => {
		setSelectedConversation(conversation);
		await fetchMessages(conversation.partner._id, conversation.residentId || undefined);
	};

	// Filter conversations by search term (family or resident name)
	const filteredConversations = React.useMemo(() => {
		const term = searchTerm.toLowerCase();
		return conversations.filter((c) =>
			(c.partner.full_name || '').toLowerCase().includes(term) || (c.residentName || '').toLowerCase().includes(term)
		);
	}, [conversations, searchTerm]);

	// Initial data loading
	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			await fetchConversations();
			setLoading(false);
		};

		if (user?.id) {
			loadData();
		}
	}, [user]);

	// Poll unread/new messages every 10s and on window focus
	useEffect(() => {
		if (!user?.id) return;
		const tick = async () => {
			await fetchConversations();
			if (selectedConversation) {
				await fetchMessages(selectedConversation.partner._id, selectedConversation.residentId || undefined);
			}
		};
		const id = setInterval(tick, 10000);
		const onFocus = () => tick();
		if (typeof window !== 'undefined') {
			window.addEventListener('focus', onFocus);
		}
		return () => {
			clearInterval(id);
			if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
		};
	}, [user, selectedConversation]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		const messagesContainer = document.getElementById('messages-container');
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}, [messages]);

	if (loading) {
		return (
			<div className="h-screen bg-white flex items-center justify-center">
				<LoadingSpinner size="large" text="Đang tải..." />
			</div>
		);
	}

	return (
		<div className="h-screen bg-white flex flex-col">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-4 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-6">
				<div className="flex items-center justify-between gap-10 flex-wrap">
					<div className="flex items-center gap-6">
					<button
							 onClick={() => router.back()}
							 className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
							 title="Quay lại trang trước"
						 >
						 <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
						</button>
						<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
							<ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent leading-tight tracking-tight">
								Tin nhắn
							</span>
							<span className="text-lg text-slate-500 font-medium">
								Trao đổi với gia đình
							</span>
						</div>
					</div>
					<div className="relative min-w-[240px] flex-1 max-w-md">
						<input
							type="text"
							placeholder="Tìm kiếm cuộc trò chuyện..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full px-4 py-3 pl-12 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200 placeholder-slate-400"
						/>
						<MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 w-full max-w-7xl mx-auto px-6">
				<div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden flex min-h-0 h-[calc(100vh-220px)]">
					{/* Conversations List */}
					<div className="shrink-0 w-[380px] md:w-[400px] lg:w-[440px] overflow-y-auto min-h-0 border-r border-gray-200 bg-slate-50/60">
						{/* List header (refined) */}
						<div className="sticky top-0 z-10 px-5 py-3 bg-white/90 backdrop-blur border-b border-slate-200">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
										<ChatBubbleLeftRightIcon className="w-4 h-4" />
									</div>
									<div className="text-slate-700 font-semibold text-sm">Cuộc trò chuyện</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-slate-500">Tổng cộng</span>
									<span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
										{filteredConversations.length}
									</span>
									<span className="text-xs text-slate-500">cuộc trò chuyện</span>
								</div>
							</div>
						</div>
						{filteredConversations.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
								<ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mb-4" />
								<p className="text-lg font-medium">Chưa có cuộc trò chuyện nào</p>
								<p className="text-sm">Bắt đầu trao đổi với gia đình</p>
							</div>
						) : (
							<div className="p-3 space-y-1">
								{filteredConversations.map((conversation, index) => (
									<div
										key={conversation.key}
										onClick={() => handleConversationSelect(conversation)}
										className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
											selectedConversation?.key === conversation.key
												? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
												: 'bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200'
										}`}
									>
										<div className="flex items-center gap-2">
											<img
												src={conversation.partner.avatar ? userAPI.getAvatarUrl(conversation.partner.avatar) : '/default-avatar.svg'}
												alt={conversation.partner.full_name}
												className="w-8 h-8 rounded-full object-cover border border-slate-200"
												onError={(e) => {
													(e.currentTarget as HTMLImageElement).src = '/default-avatar.svg';
												}}
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<h3 className="font-medium text-gray-900 truncate text-xs">
														{conversation.partner.full_name}
													</h3>
													{conversation.unreadCount > 0 && (
														<span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold min-w-[16px] text-center">
															{conversation.unreadCount}
														</span>
													)}
												</div>
												{/* Resident context */}
												{conversation.residentName && (
													<p className="text-[11px] text-blue-600 font-medium truncate mt-0.5">
														Gia đình của {conversation.residentName}
													</p>
												)}
												{conversation.lastMessage && (
													<p className="text-[11px] text-gray-600 truncate mt-0.5">
														{conversation.lastMessage.content}
													</p>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Chat Area */}
					<div className="flex-1 flex flex-col min-h-0">
						{selectedConversation ? (
							<>
								{/* Chat Header */}
								<div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 p-4">
									<div className="flex items-center gap-3">
										<img
											src={selectedConversation.partner.avatar ? userAPI.getAvatarUrl(selectedConversation.partner.avatar) : '/default-avatar.svg'}
											alt={selectedConversation.partner.full_name}
											className="w-10 h-10 rounded-full object-cover border border-slate-200"
											onError={(e) => {
												(e.currentTarget as HTMLImageElement).src = '/default-avatar.svg';
											}}
										/>
										<div>
											<h3 className="font-semibold text-gray-900">
												{selectedConversation.partner.full_name}
											</h3>
											<p className="text-sm text-gray-600">
												Gia đình{selectedConversation.residentName ? ` của ${selectedConversation.residentName}` : ''}
											</p>
										</div>
									</div>
								</div>

							{/* Messages */}
							<div
								id="messages-container"
								className="flex-1 overflow-y-auto min-h-0 p-6 space-y-3"
							>
								{messages.length === 0 ? (
									<div className="flex flex-col items-center justify-center h-full text-gray-500">
										<ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mb-2" />
										<p className="text-base font-medium">Chưa có tin nhắn nào</p>
										<p className="text-sm">Bắt đầu cuộc trò chuyện</p>
									</div>
								) : (
									messages.map((message, index) => {
										const isOwnMessage =
											message.sender_id === user?.id ||
											(typeof message.sender_id === 'object' && message.sender_id._id === user?.id);

										return (
											<div
												key={`${message._id || message.timestamp || 'msg'}-${index}`}
												className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
											>
												<div
													className={`max-w-[64%] md:max-w-[54%] lg:max-w-[50%] px-4 py-2 rounded-2xl ${
														isOwnMessage
															? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
															: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900'
												}`}
												>
													<p className="text-sm break-words">{message.content}</p>
													<div
														className={`flex items-center justify-between mt-1 text-xs ${
															isOwnMessage ? 'text-blue-100' : 'text-gray-500'
														}`}
													>
														<span>
															{new Date(message.timestamp).toLocaleTimeString('vi-VN', {
																hour: '2-digit',
																minute: '2-digit'
															})}
														</span>
														{isOwnMessage && <CheckSolid className="w-3 h-3" />}
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>

							{/* Message Input */}
							<div className="flex-shrink-0 p-4 border-t border-gray-200">
								<div className="flex gap-3 pr-3">
									<input
										type="text"
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
										placeholder="Nhập tin nhắn..."
										className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
										disabled={sending}
									/>
									<button
										onClick={handleSendMessage}
										disabled={!newMessage.trim() || sending}
										className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
									>
										{sending ? <LoadingSpinner size="small" /> : <PaperAirplaneIcon className="w-4 h-4" />}
									</button>
								</div>
							</div>
						</>
					) : (
						<div className="flex-1 flex items-center justify-center text-gray-500">
							<div className="text-center">
								<ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<p className="text-lg font-medium">Chọn cuộc trò chuyện</p>
								<p className="text-sm">Để bắt đầu trao đổi</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
		</div>
	);
}
