"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Key, CheckCircle, Upload } from 'lucide-react';

const DigitalSignature = () => {
  const [activeTab, setActiveTab] = useState('create-keys');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [files, setFiles] = useState({
    publicKey: null,
    privateKey: null,
    dataFile: null,
    hashFile: null,
    signatureFile: null,
  });

  // Fungsi untuk menangani perubahan file
  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    setFiles((prev) => ({ ...prev, [type]: arrayBuffer }));
  };

  // Fungsi untuk membuat kunci RSA
  const createKeys = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

    downloadFile("private_key.pem", arrayBufferToBase64(privateKey));
    downloadFile("public_key.pem", arrayBufferToBase64(publicKey));

    setStatus({ type: 'success', message: 'Kunci berhasil dibuat dan diunduh!' });
  };

  // Fungsi untuk menandatangani data
  const signData = async () => {
    if (!files.dataFile || !files.privateKey) {
      setStatus({
        type: 'error',
        message: 'Mohon upload file data dan private key terlebih dahulu.'
      });
      return;
    }

    const hash = await window.crypto.subtle.digest("SHA-256", files.dataFile);
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      files.privateKey,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      privateKey,
      hash
    );

    downloadFile("hash_file.txt", arrayBufferToBase64(hash));
    downloadFile("signature_file.txt", arrayBufferToBase64(signature));

    setStatus({ type: 'success', message: 'Data berhasil ditandatangani dan hash file telah dibuat.' });
  };

  // Fungsi untuk memverifikasi data
  const verifyData = async () => {
    if (!files.signatureFile || !files.publicKey || !files.hashFile) {
      setStatus({
        type: 'error',
        message: 'Mohon upload semua file yang diperlukan.'
      });
      return;
    }

    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      files.publicKey,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );

    const isValid = await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      publicKey,
      files.signatureFile,
      files.hashFile
    );

    setStatus({
      type: isValid ? 'success' : 'error',
      message: isValid ? 'Verifikasi berhasil! Tanda tangan valid.' : 'Verifikasi gagal! Tanda tangan tidak valid.',
    });
  };

  // Fungsi bantu untuk konversi array buffer ke base64
  const arrayBufferToBase64 = (buffer) => {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  };

  // Fungsi untuk mengunduh file
  const downloadFile = (filename, content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Digital Signature System
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

            {/* TabsContent for create keys */}
            <TabsContent value="create-keys">
              <Button onClick={createKeys} className="w-full">
                Generate Keys
              </Button>
            </TabsContent>

            {/* TabsContent for sign data */}
            <TabsContent value="sign-data">
              <Input type="file" onChange={(e) => handleFileChange(e, 'dataFile')} />
              <Input type="file" onChange={(e) => handleFileChange(e, 'privateKey')} />
              <Button onClick={signData} className="w-full">
                Sign Data
              </Button>
            </TabsContent>

            {/* TabsContent for verify data */}
            <TabsContent value="verify-data">
              <Input type="file" onChange={(e) => handleFileChange(e, 'signatureFile')} />
              <Input type="file" onChange={(e) => handleFileChange(e, 'publicKey')} />
              <Input type="file" onChange={(e) => handleFileChange(e, 'hashFile')} />
              <Button onClick={verifyData} className="w-full">
                Verify Data
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalSignature;
    
