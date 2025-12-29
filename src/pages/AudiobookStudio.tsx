import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, Headphones, Loader2, BookOpen } from "lucide-react";
import { AudiobookPlayer } from "@/components/audiobook/AudiobookPlayer";
import { VoiceSelector } from "@/components/audiobook/VoiceSelector";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";

export default function AudiobookStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedVoice, setSelectedVoice] = useState("JBFqnCBsd6RMkjVDRZzb");
  const [extractedText, setExtractedText] = useState("");
  const [manualText, setManualText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.epub')) {
      toast.error("Please upload a PDF or EPUB file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsExtracting(true);
    setFileName(file.name);
    setExtractedText("");
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract text");
      }

      const data = await response.json();
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error("No text could be extracted from the PDF");
      }

      setExtractedText(data.text);
      toast.success("Text extracted successfully!");
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process PDF");
      setFileName(null);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const generateAudiobook = useCallback(async () => {
    const textToConvert = activeTab === "upload" ? extractedText : manualText;
    
    if (!textToConvert || textToConvert.trim().length === 0) {
      toast.error("Please provide text to convert to audio");
      return;
    }

    if (textToConvert.length < 10) {
      toast.error("Text is too short. Please provide more content.");
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audiobook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: textToConvert,
            voiceId: selectedVoice,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      toast.success("Audiobook generated successfully!");
    } catch (error) {
      console.error("Generate audiobook error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate audiobook");
    } finally {
      setIsGenerating(false);
    }
  }, [activeTab, extractedText, manualText, selectedVoice]);

  if (!user) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to use the Audiobook Studio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Headphones className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-serif font-bold text-foreground">
                Audiobook Studio
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transform your PDFs and text into professional audiobooks using AI-powered voice synthesis
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Source
                </CardTitle>
                <CardDescription>
                  Upload a PDF/EPUB or enter text directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Enter Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="pdf-upload">PDF or EPUB File</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <Input
                          id="pdf-upload"
                          type="file"
                          accept=".pdf,.epub"
                          onChange={handleFileUpload}
                          disabled={isExtracting}
                          className="hidden"
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          {isExtracting ? (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">
                                Extracting text...
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {fileName || "Click to upload PDF or EPUB (max 10MB)"}
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {extractedText && (
                      <div className="space-y-2">
                        <Label>Extracted Text Preview</Label>
                        <Textarea
                          value={extractedText}
                          onChange={(e) => setExtractedText(e.target.value)}
                          rows={8}
                          className="resize-none"
                          placeholder="Extracted text will appear here..."
                        />
                        <p className="text-xs text-muted-foreground">
                          {extractedText.length.toLocaleString()} characters
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-text">Enter Your Text</Label>
                      <Textarea
                        id="manual-text"
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        rows={10}
                        placeholder="Paste or type the text you want to convert to audio..."
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {manualText.length.toLocaleString()} characters
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <VoiceSelector value={selectedVoice} onChange={setSelectedVoice} />

                <Button
                  onClick={generateAudiobook}
                  disabled={
                    isGenerating ||
                    isExtracting ||
                    (activeTab === "upload" ? !extractedText : !manualText)
                  }
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Headphones className="h-4 w-4 mr-2" />
                      Generate Audiobook
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Player Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Audio Player
                  </CardTitle>
                  <CardDescription>
                    Listen to your generated audiobook
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudiobookPlayer
                    audioUrl={audioUrl}
                    isGenerating={isGenerating}
                    title={fileName?.replace(/\.(pdf|epub)$/i, '') || "Your Audiobook"}
                  />
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/ebooks">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Ebooks
                    </Button>
                  </Link>
                  <Link to="/my-ebooks">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      My Library
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Info Section */}
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">How it works</p>
                  <p>
                    Upload a PDF or EPUB document, or enter text directly. Our AI will extract the content 
                    and convert it into natural-sounding speech using professional voice synthesis. 
                    Audio is generated on-demand for streaming playback.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
