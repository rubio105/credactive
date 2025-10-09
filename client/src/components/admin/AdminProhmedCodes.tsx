import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProhmedCode {
  id: string;
  code: string;
  type: string;
  isRedeemed: boolean;
  redeemedById?: string;
  redeemedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export function AdminProhmedCodes() {
  const { toast } = useToast();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateType, setGenerateType] = useState<'family' | 'individual'>('family');
  const [generateCount, setGenerateCount] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: codes, isLoading } = useQuery<ProhmedCode[]>({
    queryKey: ["/api/prohmed-codes"],
  });

  const generateCodesMutation = useMutation({
    mutationFn: (data: { type: string; count: number }) =>
      apiRequest("/api/prohmed-codes/generate", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prohmed-codes"] });
      toast({ title: `${generateCount} codici generati con successo!` });
      setGenerateDialogOpen(false);
      setGenerateCount(1);
    },
    onError: (error: any) => {
      toast({ title: "Errore: " + error.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Codice copiato!" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const unredeemed = codes?.filter(c => !c.isRedeemed) || [];
  const redeemed = codes?.filter(c => c.isRedeemed) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Codici Accesso Prohmed</CardTitle>
            <CardDescription>Gestisci codici telemedicina per utenti premium e vincitori</CardDescription>
          </div>
          <Button onClick={() => setGenerateDialogOpen(true)} data-testid="button-generate-codes">
            <Gift className="w-4 h-4 mr-2" />
            Genera Codici
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Codici Disponibili ({unredeemed.length})
          </h3>
          {isLoading ? (
            <div>Caricamento...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unredeemed.map((code) => (
                  <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell>
                      <Badge variant={code.type === 'family' ? 'default' : 'secondary'}>
                        {code.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {code.expiresAt 
                        ? new Date(code.expiresAt).toLocaleDateString()
                        : 'Mai'}
                    </TableCell>
                    <TableCell>{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                        data-testid={`button-copy-${code.id}`}
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">
            Codici Riscattati ({redeemed.length})
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codice</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Riscattato il</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redeemed.slice(0, 10).map((code) => (
                <TableRow key={code.id} data-testid={`row-redeemed-${code.id}`}>
                  <TableCell className="font-mono">{code.code}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{code.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {code.redeemedAt 
                      ? new Date(code.redeemedAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent data-testid="dialog-generate-codes">
          <DialogHeader>
            <DialogTitle>Genera Codici Prohmed</DialogTitle>
            <DialogDescription>
              Crea nuovi codici accesso per app telemedicina Prohmed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo Codice</Label>
              <Select value={generateType} onValueChange={(v: any) => setGenerateType(v)}>
                <SelectTrigger data-testid="select-code-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family (nucleo familiare)</SelectItem>
                  <SelectItem value="individual">Individual (singolo utente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="count">Quantità</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={100}
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                data-testid="input-code-count"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => generateCodesMutation.mutate({ type: generateType, count: generateCount })}
              disabled={generateCodesMutation.isPending}
              data-testid="button-submit-generate"
            >
              {generateCodesMutation.isPending ? "Generazione..." : "Genera"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
