'use client';

import React, { useState, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType
} from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';

const API_KEY = ''; // Replace with your actual API key

const InteractiveAudiobook = () => {
    const [bookData, setBookData] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [images, setImages] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const generateImage = async (prompt) => {
        try {
            const response = await axios.post(
                'https://api.aimlapi.com/images/generations',
                {
                    'model': 'stabilityai/stable-diffusion-xl-base-1.0',
                    'prompt': prompt
                },
                {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            console.log(response.data.output.choices[0].image_base64);
            const base64 = response.data.output.choices[0].image_base64
            return `data:image/png;base64,${base64}`;
        } catch (error) {
            console.error('Error generating image:', error);
            return null;
        }
    };

    const generateAllImages = async (data) => {
        setIsLoading(true);
        const imagePromises = [
            generateImage(`Book cover for "${data.title}"`),
            ...data.chapters.map((chapter, index) =>
                generateImage(`Illustration for chapter ${index + 1}: ${chapter.story.slice(0, 50)}...`)
            )
        ];

        const generatedImages = await Promise.all(imagePromises);
        const imageMap = {
            title: generatedImages[0],
            ...generatedImages.slice(1).reduce((acc, img, index) => {
                acc[index] = img;
                return acc;
            }, {})
        };

        setImages(imageMap);
        setIsLoading(false);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    setBookData(json);
                    setCurrentPage(1); // Move to the title page after successful upload

                    // Create nodes and edges for the graph
                    const newNodes = json.characters.map((char, index) => ({
                        id: char.character,
                        data: {
                            label: char.character + ' - ' + char.explanation
                        },
                        position: { x: 100 + (index % 3) * 200, y: 100 + Math.floor(index / 3) * 200 },
                        style: {
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            padding: 10,
                            width: 150,
                            textAlign: 'center'
                        },
                        sourcePosition: 'right',
                        targetPosition: 'left'
                    }));

                    const newEdges = json.relations.map((rel, index) => ({
                        id: `e${index}`,
                        source: rel.from,
                        target: rel.to,
                        type: 'straight',
                        markerEnd: {
                            type: MarkerType.Dot,
                            color: '#888',
                            width: 20,
                            height: 20
                        },
                        style: { stroke: '#888' }
                    }));

                    setNodes(newNodes);
                    setEdges(newEdges);

                    // Generate images
                    setIsLoading(true);
                    await generateAllImages(json);
                    setIsLoading(false);
                } catch (error) {
                    setIsLoading(false);
                    console.error(error)
                    alert('Error parsing JSON file. Please make sure it\'s a valid JSON.');
                }
            };
            reader.readAsText(file);
        }
    };

    const renderFileInput = () => (
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">LangStory</h1>
            <p className="text-xl mb-4">Please upload a generated story JSON file to begin</p>
            <div className="flex justify-center">
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
                />
            </div>
        </div>
    );

    const renderPage = () => {
        if (!bookData) return renderFileInput();

        if (isLoading) {
            return (
                <div className="text-center">
                    <p className="text-xl mb-16">Preparing your book...</p>
                    <div className="animate-bounce text-6xl">📚</div>
                </div>
            );
        }

        if (currentPage === 1) {
            return (
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">{bookData.title}</h1>
                    {images.title && (
                        <img src={images.title} alt="Book cover" className="mx-auto mb-4" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                    )}
                    <p className="text-xl">Click 'Next' to begin the story</p>
                </div>
            );
        }

        if (currentPage <= bookData.chapters.length + 1) {
            const chapterIndex = currentPage - 2;
            const chapter = bookData.chapters[chapterIndex];
            return (
                <div>
                    {images[chapterIndex] && (
                        <img src={images[chapterIndex]} alt={`Chapter ${chapterIndex + 1} illustration`} className="mb-4" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                    )}
                    <p className="text-lg mb-4">{chapter.story}</p>
                </div>
            );
        }

        // Character Relationships Page
        return (
            <div style={{ height: '500px', width: '100%' }}>
                <h2 className="text-2xl font-bold mb-4">Character Relationships</h2>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        );
    };

    const handleNextPage = () => {
        const totalPages = bookData ? bookData.chapters.length + 3 : 1; // Upload + Title + Chapters + Relationships
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div className="w-full p-4">
            {renderPage()}
            {bookData && currentPage < (bookData.chapters.length + 2) && !isLoading && (
                <div className="mt-8 flex justify-end">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleNextPage}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default InteractiveAudiobook;