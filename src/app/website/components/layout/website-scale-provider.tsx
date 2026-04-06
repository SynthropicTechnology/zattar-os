"use client";

import { useEffect } from "react";

export function WebsiteScaleProvider() {
  useEffect(() => {
    // Adiciona a classe que reduz a proporção global (rem) na raiz do documento (apenas para o website)
    document.documentElement.classList.add("website-root-scale");
    
    return () => {
      document.documentElement.classList.remove("website-root-scale");
    };
  }, []);

  return null;
}
