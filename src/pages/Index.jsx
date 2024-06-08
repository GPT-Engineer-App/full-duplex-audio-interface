import React, { useState, useRef } from "react";
import { Container, Button, VStack, Text } from "@chakra-ui/react";
import { FaMicrophone, FaStop } from "react-icons/fa";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleConnect = () => {
    if (isConnected) {
      wsRef.current.close();
      setIsConnected(false);
      return;
    }

    wsRef.current = new WebSocket("wss://media.agent4.ai/ZmUyNjljNTQtNzlkNS0xMWVlLWE3YTgtMGE1OGE5ZmVhYzAy/connect");
    wsRef.current.onopen = () => {
      console.log("WebSocket connection opened");
      setIsConnected(true);
    };

    wsRef.current.onmessage = async (event) => {
      const audioBlob = new Blob([event.data], { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      return;
    }

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const destination = audioContextRef.current.createMediaStreamDestination();
    source.connect(destination);

    mediaRecorderRef.current = new MediaRecorder(destination.stream, { mimeType: "audio/webm; codecs=opus" });
    mediaRecorderRef.current.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        wsRef.current.send(event.data);
      }
    };

    mediaRecorderRef.current.start(100);
    setIsRecording(true);
    setIsRecording(true);
  };

  return (
    <Container centerContent maxW="container.md" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <VStack spacing={4}>
        <Text fontSize="2xl">Full Duplex Audio Interface</Text>
        <Button onClick={handleConnect} colorScheme={isConnected ? "red" : "green"} leftIcon={isConnected ? <FaStop /> : <FaMicrophone />}>
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
        {isConnected && (
          <Button onClick={handleRecord} colorScheme={isRecording ? "red" : "blue"} leftIcon={isRecording ? <FaStop /> : <FaMicrophone />}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        )}
      </VStack>
    </Container>
  );
};

export default Index;
