"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Key, CheckCircle } from 'lucide-react';

// Your component logic...


const DigitalSignature = () => {
  const [activeTab, setActiveTab] = useState('create-keys');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [files, setFiles] = useState({
    publicKey: null,
    privateKey: null,
    dataFile: null,
    hashFile: null,
    signatureFile: null
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const createKeys = async () => {
    try {
      const response = await fetch('https://UmamRafa145.pythonanywhere.com/api/create-keys', {
        method: 'POST',
      });
      const data = await response.json();
      
      // Download private key
      const privateBlob = new Blob([data.private_key], { type: 'text/plain' });
      const privateUrl = window.URL.createObjectURL(privateBlob);
      const privateLink = document.createElement('a');
      privateLink.href = privateUrl;
      privateLink.setAttribute('download', 'private_key.pem');
      document.body.appendChild(privateLink);
      privateLink.click();
      
      // Download public key
      const publicBlob = new Blob([data.public_key], { type: 'text/plain' });
      const publicUrl = window.URL.createObjectURL(publicBlob);
      const publicLink = document.createElement('a');
      publicLink.href = publicUrl;
      publicLink.setAttribute('download', 'public_key.pem');
      document.body.appendChild(publicLink);
      publicLink.click();

      setStatus({
        type: 'success',
        message: 'Kunci berhasil dibuat! Public dan private key telah diunduh.'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Terjadi kesalahan saat membuat kunci.'
      });
    }
  };

  const signData = async () => {
    if (!files.dataFile || !files.privateKey) {
      setStatus({
        type: 'error',
        message: 'Mohon upload file data dan private key terlebih dahulu.'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', files.dataFile);
    formData.append('private_key', files.privateKey);

    try {
      const response = await fetch('https://UmamRafa145.pythonanywhere.com/api/sign', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      // Download signature
      const signatureBlob = new Blob([data.signature], { type: 'text/plain' });
      const signatureUrl = window.URL.createObjectURL(signatureBlob);
      const signatureLink = document.createElement('a');
      signatureLink.href = signatureUrl;
      signatureLink.setAttribute('download', 'signature.txt');
      document.body.appendChild(signatureLink);
      signatureLink.click();
      
      // Download hash
      const hashBlob = new Blob([data.hash], { type: 'text/plain' });
      const hashUrl = window.URL.createObjectURL(hashBlob);
      const hashLink = document.createElement('a');
      hashLink.href = hashUrl;
      hashLink.setAttribute('download', 'hash.txt');
      document.body.appendChild(hashLink);
      hashLink.click();

      setStatus({
        type: 'success',
        message: 'Data berhasil ditandatangani dan file signature telah diunduh.'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Terjadi kesalahan saat menandatangani data.'
      });
    }
  };

  const verifyData = async () => {
    if (!files.signatureFile || !files.publicKey || !files.hashFile) {
      setStatus({
        type: 'error',
        message: 'Mohon upload semua file yang diperlukan.'
      });
      return;
    }

    const formData = new FormData();
    formData.append('signature', files.signatureFile);
    formData.append('public_key', files.publicKey);
    formData.append('hash', files.hashFile);

    try {
      const response = await fetch('https://UmamRafa145.pythonanywhere.com/api/verify', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      setStatus({
        type: 'success',
        message: data.status === 'valid' ? 'Verifikasi berhasil! Tanda tangan valid.' : 'Tanda tangan tidak valid!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Terjadi kesalahan saat memverifikasi data.'
      });
    }
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

            <TabsContent value="create-keys">
              <div className="space-y-4 p-4">
                <div className="text-center">
                  <Button onClick={createKeys} className="w-full">
                    Generate Keys
                  </Button>
                </div>
              </div>
            </TabsContent>

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
