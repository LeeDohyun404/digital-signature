"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Key, CheckCircle } from "lucide-react";

const DigitalSignature = () => {
  const [activeTab, setActiveTab] = useState("create-keys");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [files, setFiles] = useState({
    publicKey: null,
    privateKey: null,
    dataFile: null,
    hashFile: null,
    signatureFile: null
  });
  
  const [signedData, setSignedData] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  // Watch for file changes and trigger verification
  useEffect(() => {
    if (files.dataFile && files.hashFile && files.signatureFile && files.publicKey) {
      verifyData();
    }
  }, [files.dataFile, files.hashFile, files.signatureFile, files.publicKey]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const arrayBufferToBase64 = (buffer) => {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToHex = (buffer) => {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const hexToArrayBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  };

  const downloadFile = (filename, content) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const createKeys = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      );

      const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
      const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;

      const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);
      const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;

      downloadFile("public_key.pem", publicKeyPem);
      downloadFile("private_key.pem", privateKeyPem);

      setStatus({
        type: "success",
        message: "RSA key pair berhasil dibuat! Public dan private key telah diunduh.",
      });
    } catch (error) {
      setStatus({ type: "error", message: "Gagal membuat key pair: " + error.message });
    }
  };

  const signData = async () => {
    if (!files.dataFile || !files.privateKey) {
      setStatus({ type: "error", message: "Mohon upload file data dan private key terlebih dahulu." });
      return;
    }

    try {
      const data = await files.dataFile.text();
      const privateKeyContent = await files.privateKey.text();
      setOriginalData(data); // Save original data for comparison

      const privateKeyBase64 = privateKeyContent
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\n/g, "");

      const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
      const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: "SHA-256",
        },
        true,
        ["sign"]
      );

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Calculate hash
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer);
      const hashHex = arrayBufferToHex(hashBuffer);

      // Sign the hash
      const signature = await window.crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        hashBuffer
      );

      const signatureHex = arrayBufferToHex(signature);

      setSignedData({
        data: data,
        hash: hashHex,
        signature: signatureHex
      });

      downloadFile("signed_data.txt", data);
      downloadFile("signature.txt", signatureHex);
      downloadFile("hash.txt", hashHex);

      setStatus({ 
        type: "success", 
        message: "Data berhasil ditandatangani! File data, signature, dan hash telah diunduh." 
      });
    } catch (error) {
      setStatus({ type: "error", message: "Gagal menandatangani data: " + error.message });
    }
  };

  const verifyData = async () => {
    if (!files.dataFile || !files.hashFile || !files.signatureFile || !files.publicKey) {
      setStatus({ type: "error", message: "Mohon upload semua file yang diperlukan." });
      return;
    }

    try {
      const currentData = await files.dataFile.text();
      const savedHash = await files.hashFile.text();
      const signature = await files.signatureFile.text();
      const publicKeyContent = await files.publicKey.text();

      // Calculate current hash
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(currentData);
      const currentHashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer);
      const currentHashHex = arrayBufferToHex(currentHashBuffer);

      // Import public key
      const publicKeyBase64 = publicKeyContent
        .replace("-----BEGIN PUBLIC KEY-----", "")
        .replace("-----END PUBLIC KEY-----", "")
        .replace(/\n/g, "");

      const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: "SHA-256",
        },
        true,
        ["verify"]
      );

      // Verify signature
      const signatureBuffer = hexToArrayBuffer(signature);
      const hashBuffer = hexToArrayBuffer(savedHash);
      const isSignatureValid = await window.crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        signatureBuffer,
        hashBuffer
      );

      // Compare hashes
      const isHashValid = currentHashHex === savedHash;

      if (isSignatureValid && isHashValid) {
        setStatus({
          type: "success",
          message: "Verifikasi berhasil! Data valid dan tidak dimodifikasi."
        });
      } else {
        setStatus({
          type: "error",
          message: "Verifikasi gagal! Data telah dimodifikasi atau tanda tangan tidak valid."
        });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Gagal memverifikasi data: " + error.message });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Digital Signature System (RSA + SHA-256)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="create-keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Buat Kunci
              </TabsTrigger>
              <TabsTrigger value="sign-data" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tanda Tangan
              </TabsTrigger>
              <TabsTrigger value="verify-data" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verifikasi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create-keys">
              <div className="space-y-4 p-4">
                <div className="text-center">
                  <Button onClick={createKeys} className="w-full">
                    Generate RSA Keys
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sign-data">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Data File</label>
                  <Input type="file" onChange={(e) => handleFileChange(e, "dataFile")} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Private Key</label>
                  <Input type="file" onChange={(e) => handleFileChange(e, "privateKey")} />
                </div>
                <Button onClick={signData} className="w-full">
                  Sign Data
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="verify-data">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Data File</label>
                  <Input type="file" onChange={(e) => handleFileChange(e, "dataFile")} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Signature File</label>
                  <Input type="file" onChange={(e) => handleFileChange(e, "signatureFile")} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Hash File</label>
                  <Input type="file" onChange={(e) => handleFileChange(e, "hashFile")} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Public Key</label>
                  <Input type="file" onChange={(e) => handleFileChange(e, "publicKey")} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {status.message && (
            <Alert className={`mt-4 ${status.type === "error" ? "bg-red-50" : "bg-green-50"}`}>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalSignature;
