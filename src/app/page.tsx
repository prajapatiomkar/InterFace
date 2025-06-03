"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [URL, setURL] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [inputModel, setInputModel] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const savedURL = localStorage.getItem("apiURL");
    const savedModel = localStorage.getItem("apiModel");

    if (savedURL && savedModel) {
      setURL(savedURL);
      setInputModel(savedModel);
      setOpen(false); // skip dialog
    } else {
      setOpen(true); // show dialog
    }
  }, []);

  const handleTheSubmit = async () => {
    setLoading(true);
    setMessage("");
    const response = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({
        model: inputModel,
        prompt: inputPrompt,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });

        chunk.split("\n").forEach((line) => {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                setMessage((prev) => prev + json.response);
              }
            } catch (e) {
              console.error("Error parsing JSON line:", e);
            }
          }
        });
      }
    }
    setLoading(false);
  };

  const handleTheDialogSubmit = () => {
    if (URL && inputModel) {
      localStorage.setItem("apiURL", URL);
      localStorage.setItem("apiModel", inputModel);
      setOpen(false);
    }
  };
  return (
    <div className="">
      <Dialog open={open} onOpenChange={setOpen}>
        <form>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="http://localhost:11434"
                  onChange={(e) => setURL(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="llama"
                  onChange={(e) => setInputModel(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={false}
                onClick={handleTheDialogSubmit}
              >
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>

      <div className="flex justify-between py-4">
        <Link href="/">
          <Button variant="link" className="text-2xl">
            InterFace
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center px-4 py-6">
        <div className="flex w-full max-w-2xl gap-2">
          <Input
            className="flex-1"
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Enter your prompt..."
          />
          <Button
            onClick={handleTheSubmit}
            disabled={loading || inputPrompt.trim() === ""}
          >
            {loading ? "Generating..." : "Generate Answer"}
          </Button>
        </div>

        <div className="mt-6 w-full max-w-2xl whitespace-pre-wrap text-lg border border-gray-200 rounded-md p-4 bg-gray-50">
          {message.length > 0 ? message : "No response yet"}
        </div>
      </div>
    </div>
  );
}
