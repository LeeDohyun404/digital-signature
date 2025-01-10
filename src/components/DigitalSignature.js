"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Key, CheckCircle } from "lucide-react";

const DigitalSignature = () => {
  // ... (previous state declarations remain the same)

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

  // Remove the automatic verification useEffect

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  // ... (keep all the utility functions and createKeys/signData the same)

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
      } else if (!isHashValid) {
        setStatus({
          type: "error",
          message: "Verifikasi gagal! Data telah dimodifikasi (hash tidak cocok)."
        });
      } else {
        setStatus({
          type: "error",
          message: "Verifikasi gagal! Tanda tangan digital tidak valid."
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
                <Button onClick={verifyData} className="w-full">
                  Verifikasi Data
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
