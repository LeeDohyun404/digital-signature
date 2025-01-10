"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Key, CheckCircle } from "lucide-react";
import crypto from "crypto";

const DigitalSignature = () => {
  const [activeTab, setActiveTab] = useState("create-keys");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [files, setFiles] = useState({
    publicKey: null,
    privateKey: null,
    dataFile: null,
    signatureFile: null,
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    setFiles((prev) => ({ ...prev, [type]: file }));
  };

  // Generate RSA key pair
  const createKeys = () => {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      const downloadFile = (filename, content) => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      };

      downloadFile("public_key.pem", publicKey);
      downloadFile("private_key.pem", privateKey);

      setStatus({
        type: "success",
        message: "RSA key pair berhasil dibuat! Public dan private key telah diunduh.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: "Gagal membuat key pair: " + error.message,
      });
    }
  };

  // Sign data using RSA and SHA-256
  const signData = async () => {
    if (!files.dataFile || !files.privateKey) {
      setStatus({
        type: "error",
        message: "Mohon upload file data dan private key terlebih dahulu.",
      });
      return;
    }

    try {
      // Read the files
      const data = await files.dataFile.text();
      const privateKeyContent = await files.privateKey.text();

      // Create hash of the data using SHA-256
      const dataHash = crypto.createHash('sha256').update(data).digest();

      // Sign the hash using RSA
      const signer = crypto.createSign('SHA256');
      signer.update(data);
      const signature = signer.sign(privateKeyContent, 'base64');

      // Download signature
      const downloadFile = (filename, content) => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      };

      downloadFile("signature.txt", signature);

      setStatus({
        type: "success",
        message: "Data berhasil ditandatangani dan file signature telah diunduh.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: "Gagal menandatangani data: " + error.message,
      });
    }
  };

  // Verify signature using RSA and SHA-256
  const verifyData = async () => {
    if (!files.signatureFile || !files.publicKey || !files.dataFile) {
      setStatus({
        type: "error",
        message: "Mohon upload semua file yang diperlukan.",
      });
      return;
    }

    try {
      // Read all files
      const data = await files.dataFile.text();
      const publicKeyContent = await files.publicKey.text();
      const signature = await files.signatureFile.text();

      // Verify the signature
      const verifier = crypto.createVerify('SHA256');
      verifier.update(data);
      const isValid = verifier.verify(publicKeyContent, signature, 'base64');

      if (isValid) {
        setStatus({
          type: "success",
          message: "Verifikasi berhasil! Tanda tangan valid.",
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
                  <label className="block text-sm font-medium">Upload Public Key</label>
                  <Input type="file" onChange={(e) => handleFileChange(e, "publicKey")} />
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
