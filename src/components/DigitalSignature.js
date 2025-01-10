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

  // Fungsi untuk membuat kunci RSA
  const createKeys = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP", // RSA untuk enkripsi
        modulusLength: 2048, // Panjang kunci RSA
        publicExponent: new Uint8Array([1, 0, 1]), // Exponent untuk RSA
        hash: "SHA-256", // Hash menggunakan SHA-256
      },
      true,
      ["encrypt", "decrypt"] // Kunci untuk enkripsi dan dekripsi
    );

    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

    downloadFile("private_key.pem", arrayBufferToBase64(privateKey));
    downloadFile("public_key.pem", arrayBufferToBase64(publicKey));

    setStatus({ type: 'success', message: 'Kunci berhasil dibuat dan diunduh!' });
  };

  // Fungsi untuk membuat hash
  const signData = async () => {
    if (!files.dataFile || !files.privateKey) {
      setStatus({
        type: 'error',
        message: 'Mohon upload file data dan private key terlebih dahulu.'
      });
      return;
    }

    const data = await files.dataFile.arrayBuffer();
    const privateKey = await base64ToArrayBuffer(files.privateKey);

    const hash = await window.crypto.subtle.digest("SHA-256", data);
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

  // Fungsi untuk verifikasi tanda tangan
  const verifyData = async () => {
    if (!files.signatureFile || !files.publicKey || !files.hashFile) {
      setStatus({
        type: 'error',
        message: 'Mohon upload semua file yang diperlukan.'
      });
      return;
    }

    const publicKey = await base64ToArrayBuffer(files.publicKey);
    const hash = await base64ToArrayBuffer(files.hashFile);
    const signature = await base64ToArrayBuffer(files.signatureFile);

    const isValid = await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      publicKey,
      signature,
      hash
    );

    setStatus({
      type: isValid ? 'success' : 'error',
      message: isValid ? 'Verifikasi berhasil! Tanda tangan valid.' : 'Verifikasi gagal! Tanda tangan tidak valid.',
    });
  };

  // Fungsi bantu untuk konversi array buffer ke base64
  const arrayBufferToBase64 = (buffer) => {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return btoa(binary);
  };

  // Fungsi bantu untuk konversi base64 ke array buffer
  const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer.buffer;
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

            {/* Create Keys Tab */}
            <TabsContent value="create-keys">
              <div className="space-y-4 p-4">
                <div className="text-center">
                  <Button onClick={createKeys} className="w-full">
                    Generate Keys
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Sign Data Tab */}
            <TabsContent value="sign-data">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Data File</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'dataFile')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Private Key</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'privateKey')}
                    />
                  </div>
                </div>
                <Button onClick={signData} className="w-full">
                  Sign Data
                </Button>
              </div>
            </TabsContent>

            {/* Verify Data Tab */}
            <TabsContent value="verify-data">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Signature File</label>
                  <Input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'signatureFile')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Public Key</label>
                  <Input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'publicKey')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Upload Hash File</label>
                  <Input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'hashFile')}
                  />
                </div>
                <Button onClick={verifyData} className="w-full">
                  Verify Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {status.message && (
            <Alert className={`mt-4 ${status.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
              <AlertDescription>
                {status.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalSignature;
    
