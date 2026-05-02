require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Trend = require('../models/Trend');
const Notification = require('../models/Notification');
const ragService = require('../services/ragService');
const { getEmbedding } = require('../utils/embedding');
const logger = require('../utils/logger');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');

    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Trend.deleteMany({});
    await Notification.deleteMany({});
    logger.info('Cleared existing data');

    const users = await User.create([
      {
        username: 'john_dev',
        email: 'john@example.com',
        oauthProvider: 'google',
        oauthId: 'google_123',
        interests: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
        goals: {
          skillLevel: 'intermediate',
          career: 'full-stack-developer',
        },
      },
      {
        username: 'jane_coder',
        email: 'jane@example.com',
        oauthProvider: 'github',
        oauthId: 'github_456',
        interests: ['Python', 'AI', 'Machine Learning', 'Deep Learning', 'PyTorch'],
        goals: {
          skillLevel: 'advanced',
          career: 'ml-engineer',
        },
      },
      {
        username: 'alice_engineer',
        email: 'alice@example.com',
        oauthProvider: 'google',
        oauthId: 'google_789',
        interests: ['TypeScript', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        goals: {
          skillLevel: 'expert',
          career: 'devops-engineer',
        },
      },
      {
        username: 'bob_frontend',
        email: 'bob@example.com',
        oauthProvider: 'github',
        oauthId: 'github_101',
        interests: ['React', 'Vue', 'Tailwind', 'CSS', 'UI/UX'],
        goals: {
          skillLevel: 'intermediate',
          career: 'frontend-developer',
        },
      },
      {
        username: 'sarah_backend',
        email: 'sarah@example.com',
        oauthProvider: 'google',
        oauthId: 'google_202',
        interests: ['Node.js', 'PostgreSQL', 'GraphQL', 'Redis', 'Microservices'],
        goals: {
          skillLevel: 'advanced',
          career: 'backend-developer',
        },
      },
    ]);

    logger.info('Created dummy users');

    const postsData = [
      {
        userId: users[0]._id,
        title: 'Getting Started with React Hooks',
        content: 'React Hooks revolutionized how we write React components. In this comprehensive guide, we will explore useState, useEffect, useContext, and custom hooks. Hooks allow you to use state and other React features without writing a class. They provide a more direct API to the React concepts you already know. Learn how to manage component state, perform side effects, and share logic between components using hooks. We will cover best practices, common pitfalls, and real-world examples to help you master React Hooks.',
        tldr: 'A comprehensive guide to React Hooks covering useState, useEffect, and custom hooks. Learn modern React patterns.',
        blogUrl: 'https://react.dev/learn/hooks',
        tags: ['react', 'javascript', 'hooks', 'frontend', 'web-development'],
        type: 'blog',
        likes: 45,
        shares: 12,
      },
      {
        userId: users[1]._id,
        title: 'Introduction to RAG Architecture',
        content: 'Retrieval-Augmented Generation (RAG) is a powerful AI architecture that combines the strengths of retrieval-based and generation-based models. RAG enhances large language models by retrieving relevant documents from a knowledge base before generating responses. This approach improves accuracy, reduces hallucinations, and provides source citations. In this article, we explore vector databases, embeddings, and how to implement RAG using LangChain. We will build a complete RAG system step-by-step.',
        tldr: 'Learn about RAG architecture, vector databases, and how to implement it with LangChain for better AI responses.',
        blogUrl: 'https://python.langchain.com/docs/tutorials/rag/',
        tags: ['ai', 'rag', 'nlp', 'langchain', 'python', 'llm'],
        type: 'blog',
        likes: 89,
        shares: 34,
      },
      {
        userId: users[2]._id,
        title: 'Docker Best Practices for Production',
        content: 'Docker has transformed application deployment. This guide covers best practices for containerizing applications in production environments. Topics include multi-stage builds, image optimization, security scanning, orchestration with Kubernetes, monitoring, and CI/CD integration. Learn how to create efficient, secure Docker images and deploy them at scale. We will also cover networking, volumes, and docker-compose for local development.',
        tldr: 'Production-ready Docker practices covering image optimization, security, and Kubernetes orchestration.',
        blogUrl: 'https://docs.docker.com/develop/dev-best-practices/',
        tags: ['docker', 'kubernetes', 'devops', 'containers', 'deployment'],
        type: 'blog',
        likes: 67,
        shares: 23,
      },
      {
        userId: users[0]._id,
        title: 'Building RESTful APIs with Express.js',
        content: 'Express.js is the most popular Node.js framework for building web applications and APIs. This tutorial covers routing, middleware, error handling, authentication with Passport.js, database integration with MongoDB, input validation, and API documentation with Swagger. Learn to build scalable, maintainable REST APIs following best practices. Includes examples for JWT authentication, rate limiting, and security headers.',
        tldr: 'Complete guide to building RESTful APIs with Express.js, covering routing, middleware, and authentication.',
        blogUrl: 'https://expressjs.com/en/guide/routing.html',
        tags: ['node.js', 'express', 'api', 'backend', 'javascript', 'rest'],
        type: 'blog',
        likes: 52,
        shares: 18,
      },
      {
        userId: users[1]._id,
        title: 'Deep Dive into Ollama for Local LLMs',
        content: 'Ollama enables running large language models locally on your machine. This guide explores how to install Ollama, download models like Llama 3 and Mistral, integrate with applications using the API, and optimize performance. Running LLMs locally ensures privacy, reduces costs, and enables offline AI capabilities. Perfect for developers building AI-powered applications. We will build a chatbot using Ollama and integrate it with a web application.',
        tldr: 'Learn to run LLMs locally with Ollama for privacy-focused, offline AI applications.',
        blogUrl: 'https://ollama.com/blog/getting-started',
        tags: ['ai', 'llm', 'ollama', 'privacy', 'python', 'local-ai'],
        type: 'blog',
        likes: 101,
        shares: 42,
      },
      {
        userId: users[3]._id,
        title: 'Mastering Tailwind CSS: A Complete Guide',
        content: 'Tailwind CSS is a utility-first CSS framework that enables rapid UI development. Learn how to set up Tailwind, use utility classes, customize your design system, optimize for production, and integrate with React, Vue, or vanilla JavaScript. This guide covers responsive design, dark mode, animations, and best practices for maintaining large-scale applications with Tailwind.',
        tldr: 'Complete guide to Tailwind CSS covering setup, customization, and production optimization.',
        blogUrl: 'https://tailwindcss.com/docs',
        tags: ['tailwind', 'css', 'frontend', 'ui', 'web-design'],
        type: 'blog',
        likes: 73,
        shares: 28,
      },
      {
        userId: users[4]._id,
        title: 'GraphQL vs REST: Which to Choose?',
        content: 'GraphQL and REST are two popular API architectures. This article compares their strengths, weaknesses, and use cases. Learn when to use GraphQL for complex data requirements and when REST is sufficient. We cover performance, caching, tooling, learning curve, and real-world examples from companies using each approach. Includes implementation examples with Apollo Server and Express.',
        tldr: 'Comprehensive comparison of GraphQL and REST APIs with real-world use cases and examples.',
        blogUrl: 'https://www.apollographql.com/blog/graphql-vs-rest/',
        tags: ['graphql', 'rest', 'api', 'backend', 'architecture'],
        type: 'blog',
        likes: 58,
        shares: 15,
      },
      
      {
        userId: users[0]._id,
        title: 'Awesome React Resources',
        content: 'A curated list of awesome React libraries, tools, tutorials, and resources. This repository includes the best React UI frameworks, state management solutions, routing libraries, testing tools, and learning resources. Updated regularly with the latest React ecosystem developments. Perfect for both beginners and experienced React developers.',
        tldr: 'Curated collection of the best React libraries, tools, and learning resources.',
        blogUrl: 'https://github.com/enaqx/awesome-react',
        tags: ['react', 'javascript', 'resources', 'awesome-list', 'frontend'],
        type: 'repo',
        likes: 156,
        shares: 67,
      },
      {
        userId: users[2]._id,
        title: 'Kubernetes Patterns and Best Practices',
        content: 'Collection of Kubernetes design patterns, deployment strategies, and operational best practices. Includes YAML configurations, Helm charts, and examples for common scenarios like blue-green deployments, canary releases, autoscaling, monitoring, and service mesh integration. Essential resource for DevOps engineers working with Kubernetes.',
        tldr: 'Design patterns and best practices for Kubernetes deployments and operations.',
        blogUrl: 'https://github.com/gravitational/workshop',
        tags: ['kubernetes', 'devops', 'deployment', 'k8s', 'infrastructure'],
        type: 'repo',
        likes: 92,
        shares: 38,
      },
      {
        userId: users[1]._id,
        title: 'LangChain Templates and Examples',
        content: 'Ready-to-use LangChain templates for building AI applications. Includes examples for RAG systems, chatbots, agents, document analysis, and more. Each template is fully documented with installation instructions, usage examples, and customization guides. Built with Python and modern AI frameworks.',
        tldr: 'Production-ready LangChain templates for AI applications including RAG and chatbots.',
        blogUrl: 'https://github.com/langchain-ai/langchain',
        tags: ['langchain', 'ai', 'python', 'rag', 'chatbot', 'llm'],
        type: 'repo',
        likes: 201,
        shares: 89,
      },
      
      {
        userId: users[0]._id,
        title: 'Full Stack Web Development Course 2024',
        content: 'Complete full-stack web development course covering HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, and deployment. Learn to build modern web applications from scratch. Includes 20+ hours of video content, coding exercises, and real-world projects. Perfect for beginners looking to become full-stack developers.',
        tldr: '20+ hour course on full-stack development with React, Node.js, and MongoDB.',
        blogUrl: 'https://www.youtube.com/watch?v=example1',
        tags: ['full-stack', 'react', 'node.js', 'mongodb', 'tutorial', 'course'],
        type: 'video',
        likes: 312,
        shares: 145,
      },
      {
        userId: users[1]._id,
        title: 'Building AI Applications with Ollama',
        content: 'Learn how to build AI-powered applications using Ollama and local LLMs. This tutorial covers installation, model selection, API integration, and building a complete chatbot application. No cloud API keys required - everything runs locally. Includes source code and deployment guide.',
        tldr: 'Build AI applications with Ollama - complete tutorial with chatbot project.',
        blogUrl: 'https://www.youtube.com/watch?v=example2',
        tags: ['ollama', 'ai', 'llm', 'tutorial', 'python', 'chatbot'],
        type: 'video',
        likes: 267,
        shares: 98,
      },
      
      {
        userId: users[4]._id,
        title: 'The Future of Web Development - Interview with Industry Leaders',
        content: 'Join us for an in-depth discussion about the future of web development. We talk with industry leaders about emerging technologies, AI integration, WebAssembly, edge computing, and what developers should learn in 2024. Featuring insights on career growth, best practices, and predictions for the next decade of web development.',
        tldr: 'Podcast discussing future web technologies, AI integration, and career advice with industry experts.',
        blogUrl: 'https://podcast.example.com/future-of-web',
        tags: ['podcast', 'web-development', 'ai', 'career', 'technology'],
        type: 'podcast',
        likes: 89,
        shares: 34,
      },
      {
        userId: users[2]._id,
        title: 'DevOps Best Practices and Cloud Native Architecture',
        content: 'Deep dive into modern DevOps practices, cloud-native architecture, and infrastructure as code. Discussion covers Docker, Kubernetes, CI/CD pipelines, monitoring, security, and cost optimization. Expert guests share their experiences from managing large-scale production systems. Essential listening for DevOps engineers.',
        tldr: 'Expert discussion on DevOps, cloud-native architecture, and managing production systems.',
        blogUrl: 'https://podcast.example.com/devops-practices',
        tags: ['podcast', 'devops', 'cloud', 'kubernetes', 'infrastructure'],
        type: 'podcast',
        likes: 76,
        shares: 29,
      },
    ];

    const posts = [];
    for (const postData of postsData) {
      try {
        const embedding = await getEmbedding(`${postData.title}\n\n${postData.content}`);
        postData.embedding = embedding;

        const post = await Post.create(postData);
        posts.push(post);

        const docs = await ragService.chunkAndEmbed(postData.content, {
          postId: post._id.toString(),
          url: postData.blogUrl,
          title: postData.title,
        });
        await ragService.addDocuments(docs);
        
        logger.info(`Created post: ${postData.title}`);
      } catch (error) {
        logger.error(`Error creating post ${postData.title}:`, error.message);
      }
    }

    logger.info('Created dummy posts and added to vector store');

    await Comment.create([
      {
        postId: posts[0]._id,
        userId: users[1]._id,
        text: 'Great introduction to hooks! This really helped me understand the concepts.',
      },
      {
        postId: posts[0]._id,
        userId: users[2]._id,
        text: 'I have been using hooks for a while now, and they make React so much cleaner. useEffect is a game changer!',
      },
      {
        postId: posts[0]._id,
        userId: users[3]._id,
        text: 'Can you explain more about custom hooks? I am still confused about when to create them.',
      },
      {
        postId: posts[1]._id,
        userId: users[0]._id,
        text: 'Excellent explanation of RAG. Looking forward to implementing this in my project.',
      },
      {
        postId: posts[1]._id,
        userId: users[2]._id,
        text: 'This is exactly what I needed! Vector databases are fascinating.',
      },
      {
        postId: posts[2]._id,
        userId: users[1]._id,
        text: 'These Docker tips are gold! Especially the multi-stage builds section.',
      },
      {
        postId: posts[2]._id,
        userId: users[4]._id,
        text: 'We use these practices in production. Can confirm they work great!',
      },
      {
        postId: posts[3]._id,
        userId: users[3]._id,
        text: 'Just built my first Express API using this guide. Thanks!',
      },
      {
        postId: posts[4]._id,
        userId: users[0]._id,
        text: 'Ollama is amazing for prototyping AI features without API costs!',
      },
      {
        postId: posts[4]._id,
        userId: users[3]._id,
        text: 'Does this work on Windows or Mac only? I am using Linux.',
      },
      {
        postId: posts[5]._id,
        userId: users[0]._id,
        text: 'Tailwind has completely changed how I write CSS. Never going back!',
      },
      {
        postId: posts[6]._id,
        userId: users[1]._id,
        text: 'We migrated from REST to GraphQL last year. Best decision ever.',
      },
      {
        postId: posts[7]._id,
        userId: users[4]._id,
        text: 'This list is a goldmine! Bookmarked for future reference.',
      },
      {
        postId: posts[8]._id,
        userId: users[0]._id,
        text: 'Great resource for K8s patterns. The autoscaling section is particularly useful.',
      },
      {
        postId: posts[10]._id,
        userId: users[2]._id,
        text: 'Best full-stack course I have found. Very comprehensive!',
      },
      {
        postId: posts[11]._id,
        userId: users[3]._id,
        text: 'Built my first local AI app following this tutorial. Mind = blown!',
      },
    ]);

    logger.info('Created dummy comments');

    await Trend.create([
      {
        topic: 'React 19 Released',
        source: 'github',
        data: { stars: 450, url: 'https://github.com/facebook/react/releases' },
        summary: 'React 19 introduces server components and improved performance',
        relatedPosts: [posts[0]._id, posts[7]._id],
      },
      {
        topic: 'GPT-4 Vision API',
        source: 'stackoverflow',
        data: { views: 5230, questions: 42 },
        summary: 'Developers exploring GPT-4 Vision capabilities',
        relatedPosts: [posts[1]._id, posts[4]._id],
      },
      {
        topic: 'Kubernetes 1.30',
        source: 'github',
        data: { stars: 2890, contributors: 156 },
        summary: 'Latest Kubernetes release with enhanced security features',
        relatedPosts: [posts[2]._id, posts[8]._id],
      },
      {
        topic: 'TypeScript Best Practices',
        source: 'stackoverflow',
        data: { views: 3670, answers: 28 },
        summary: 'Community discussing TypeScript coding standards',
        relatedPosts: [posts[3]._id],
      },
      {
        topic: 'Vector Databases',
        source: 'github',
        data: { stars: 4120, trending: true },
        summary: 'Growing interest in vector databases for AI applications',
        relatedPosts: [posts[1]._id, posts[9]._id],
      },
    ]);

    logger.info('Created trending topics');

    const notifications = [];
    notifications.push(
      {
        userId: users[0]._id,
        type: 'comment',
        message: 'jane_coder commented on your post "Getting Started with React Hooks"',
        relatedId: posts[0]._id,
        read: false,
      },
      {
        userId: users[0]._id,
        type: 'recommendation',
        message: 'New recommended post based on your interests: Docker Best Practices',
        relatedId: posts[2]._id,
        read: false,
      },
      {
        userId: users[1]._id,
        type: 'new_post',
        message: 'New trending post in AI: Introduction to RAG Architecture',
        relatedId: posts[1]._id,
        read: true,
      },
      {
        userId: users[1]._id,
        type: 'comment',
        message: 'john_dev commented on "Introduction to RAG Architecture"',
        relatedId: posts[1]._id,
        read: false,
      },
      {
        userId: users[2]._id,
        type: 'comment',
        message: 'sarah_backend commented on your post',
        relatedId: posts[2]._id,
        read: false,
      },
      {
        userId: users[3]._id,
        type: 'recommendation',
        message: 'Based on your interests: Mastering Tailwind CSS',
        relatedId: posts[5]._id,
        read: false,
      },
    );

    await Notification.create(notifications);
    logger.info('Created notifications');

    await User.findByIdAndUpdate(users[0]._id, {
      $push: {
        activityHistory: [
          { action: 'view', postId: posts[1]._id, timestamp: new Date(Date.now() - 86400000) },
          { action: 'like', postId: posts[1]._id, timestamp: new Date(Date.now() - 82800000) },
          { action: 'view', postId: posts[4]._id, timestamp: new Date(Date.now() - 72000000) },
          { action: 'comment', postId: posts[1]._id, timestamp: new Date(Date.now() - 43200000) },
          { action: 'share', postId: posts[4]._id, timestamp: new Date(Date.now() - 21600000) },
        ],
      },
    });

    await User.findByIdAndUpdate(users[1]._id, {
      $push: {
        activityHistory: [
          { action: 'view', postId: posts[0]._id, timestamp: new Date(Date.now() - 86400000) },
          { action: 'like', postId: posts[0]._id, timestamp: new Date(Date.now() - 79200000) },
          { action: 'view', postId: posts[2]._id, timestamp: new Date(Date.now() - 64800000) },
          { action: 'like', postId: posts[2]._id, timestamp: new Date(Date.now() - 36000000) },
        ],
      },
    });

    logger.info('Added activity history to users');

    logger.info('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
