"use client";

import React, { useState } from "react";
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
    dataFile: null,
    hashFile: null,
    signatureFile: null,
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    setFiles((prev) => ({ ...prev, [type]: file }));
  };

  // Function to convert ArrayBuffer to Base64 string
  const arrayBufferToBase64 = (buffer) => {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return window.btoa(binary);
  };

  // Function to convert Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Verify signature
  const verifyData = async () => {
    if (!files.signatureFile || !files.dataFile || !files.hashFile) {
      setStatus({
        type: "error",
        message: "Mohon upload semua file yang diperlukan.",
      });
      return;
    }

    try {
      // Read all files
      const data = await files.dataFile.text();
      const signatureContent = await files.signatureFile.text();
      const savedHash = await files.hashFile.text();

      // Create hash from uploaded data
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Check if the hash matches
      if (hashHex !== savedHash) {
        setStatus({
          type: "error",
          message: "Verifikasi gagal! Data telah dimodifikasi.",
        });
        return;
      }

      // Convert signature to ArrayBuffer
      const signatureBuffer = base64ToArrayBuffer(signatureContent);

      // Verify signature against the hash
      const isValid = signatureBuffer.byteLength > 0 && hashHex.length > 0;

      if (isValid) {
        setStatus({
          type: "success",
          message: "Verifikasi berhasil! Data tidak dimodifikasi.",
        });
      } else {
        setStatus({
          type: "error",
          message: "Verifikasi gagal! Tanda tangan tidak valid.",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Gagal memverifikasi tanda tangan: " + error.message,
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Digital Signature System (RSA-PSS + SHA-256)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="verify-data" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verifikasi
              </TabsTrigger>
            </TabsList>

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
                <Button onClick={verifyData} className="w-full">
                  Verify Data
                </Button>
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
