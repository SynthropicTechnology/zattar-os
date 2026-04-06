# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - heading "Command Palette" [level=2] [ref=e3]
    - paragraph [ref=e4]: Search for a command to run...
  - generic [ref=e7]:
    - img "Zattar Advogados" [ref=e10]
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email
          - textbox "Email" [ref=e15]:
            - /placeholder: voce@zattar.com.br
        - generic [ref=e16]:
          - generic [ref=e17]: Senha
          - generic [ref=e18]:
            - textbox "Senha" [ref=e19]:
              - /placeholder: Digite sua senha
            - button "Mostrar senha" [ref=e20] [cursor=pointer]:
              - img [ref=e21]
        - button "Entrar" [ref=e24] [cursor=pointer]:
          - text: Entrar
          - img
      - link "Esqueci minha senha" [ref=e26] [cursor=pointer]:
        - /url: /app/forgot-password
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e32] [cursor=pointer]:
    - generic [ref=e35]:
      - text: Compiling
      - generic [ref=e36]:
        - generic [ref=e37]: .
        - generic [ref=e38]: .
        - generic [ref=e39]: .
  - alert [ref=e40]
```