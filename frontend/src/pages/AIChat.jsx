import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send, Bot, User, Sparkles, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { aiAPI } from '../api/index';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const AIChat = () => {
  const [query, setQuery] = useState('');
  const [briefingTopics, setBriefingTopics] = useState('react,node,ai');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I can answer based on the available developer context.',
    },
  ]);

  const { data: briefingData, refetch: refetchBriefing, isFetching: briefingLoading } = useQuery({
    queryKey: ['developer-briefing', briefingTopics],
    queryFn: () => aiAPI.getBriefing({ topics: briefingTopics, refresh: false, days: 3 }),
  });

  const queryMutation = useMutation({
    mutationFn: (question) => aiAPI.query(question),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        fallback: Boolean(data.fallback),
      }]);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: query }]);
    
    queryMutation.mutate(query);
    setQuery('');
  };

  const exampleQueries = [
    'What are the latest trends in React?',
    'Explain microservices architecture',
    'Best practices for API design',
    'How does RAG work?',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bot size={28} className="mr-3 text-primary-600" />
            AI Assistant
          </h1>
          <p className="text-gray-600 mt-1">Context-aware answers and a curated developer briefing</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg">
          <Sparkles size={18} />
          <span className="text-sm font-medium">Context-Aware</span>
        </div>
      </div>

      

      {}
      <Card className="p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                {}
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.role === 'user' ? (
                      <p>{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {}
                  {message.fallback && (
                    <p className="mt-2 text-xs text-amber-600">
                      ⚠️ AI model unavailable — showing fallback response.
                    </p>
                  )}

                </div>
              </div>
            </div>
          ))}

          {}
          {queryMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {}
      {messages.length === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exampleQueries.map((exampleQuery) => (
            <button
              key={exampleQuery}
              onClick={() => setQuery(exampleQuery)}
              className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <p className="text-sm text-gray-700">{exampleQuery}</p>
            </button>
          ))}
        </div>
      )}

      {}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          placeholder="Ask me anything about tech..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!query.trim() || queryMutation.isPending}
          loading={queryMutation.isPending}
        >
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
};

export default AIChat;
