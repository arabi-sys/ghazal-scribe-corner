import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function extractTextFromEpub(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log("Extracting text from EPUB...");
  
  const blob = new Blob([arrayBuffer]);
  const zipReader = new ZipReader(new BlobReader(blob));
  const entries = await zipReader.getEntries();
  
  // Find all XHTML/HTML content files
  const contentFiles = entries.filter(entry => 
    !entry.directory && 
    (entry.filename.endsWith('.xhtml') || 
     entry.filename.endsWith('.html') || 
     entry.filename.endsWith('.htm')) &&
    !entry.filename.includes('nav') &&
    !entry.filename.includes('toc')
  );

  console.log(`Found ${contentFiles.length} content files in EPUB`);

  // Sort by filename to maintain order
  contentFiles.sort((a, b) => a.filename.localeCompare(b.filename));

  let fullText = "";

  for (const entry of contentFiles) {
    if (entry.getData) {
      const textWriter = new TextWriter();
      const content = await entry.getData(textWriter);
      
      // Strip HTML tags and clean up the text
      const cleanedText = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanedText.length > 0) {
        fullText += cleanedText + "\n\n";
      }
    }
  }

  await zipReader.close();
  
  return fullText.trim();
}

async function extractTextFromPdf(arrayBuffer: ArrayBuffer, apiKey: string): Promise<string> {
  console.log("Extracting text from PDF using AI...");
  
  // Convert to base64 in chunks to avoid stack overflow
  const uint8Array = new Uint8Array(arrayBuffer);
  let base64 = "";
  const chunkSize = 32768;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    base64 += String.fromCharCode(...chunk);
  }
  base64 = btoa(base64);
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract and return ONLY the text content from this PDF document. Do not add any commentary, headers, or formatting. Just return the raw text content that would be suitable for converting to an audiobook. If you cannot read the document, return an error message starting with 'ERROR:'."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error("Failed to extract text from PDF");
  }

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content || "";

  if (extractedText.startsWith("ERROR:")) {
    throw new Error(extractedText);
  }

  return extractedText;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    const fileName = file.name.toLowerCase();
    const isEpub = fileName.endsWith('.epub');
    const isPdf = fileName.endsWith('.pdf');

    if (!isEpub && !isPdf) {
      throw new Error("Unsupported file type. Please upload a PDF or EPUB file.");
    }

    console.log(`Processing ${isEpub ? 'EPUB' : 'PDF'} file: ${file.name}, size: ${file.size} bytes`);

    const arrayBuffer = await file.arrayBuffer();
    let extractedText = "";

    if (isEpub) {
      extractedText = await extractTextFromEpub(arrayBuffer);
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
      extractedText = await extractTextFromPdf(arrayBuffer, LOVABLE_API_KEY);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(`No text could be extracted from the ${isEpub ? 'EPUB' : 'PDF'}`);
    }

    console.log(`Extracted ${extractedText.length} characters from ${isEpub ? 'EPUB' : 'PDF'}`);

    return new Response(
      JSON.stringify({ text: extractedText }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Extract text error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
