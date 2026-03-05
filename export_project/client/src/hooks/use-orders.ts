import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCreateOrder() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertOrder) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error("Falha ao criar o pedido.");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Retrato em produção",
        description: "Suas fotos foram recebidas. Sua prévia estará pronta em breve.",
        className: "bg-primary text-primary-foreground border-none font-sans",
      });
    },
    onError: () => {
      toast({
        title: "Erro no envio",
        description: "Não foi possível processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  });
}
