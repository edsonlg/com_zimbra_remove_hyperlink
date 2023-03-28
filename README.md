# com_zimbra_remove_hyperlink
Zimlet (plugin) para remover hyperlink do corpo do e-mail. 

O objetivo deste plugin para o Zimbra 8.7.0 é reduzir a possibilidade do usuário clicar de forma intencional ou não em hyperlinks presentes em mensagens recebidas que possam levar ao download ou instalação de vírus, ransomware, etc. 

Ao carregar uma mensagem o plugin irá comparar cada hyperlink encontrado com os domínios existentes na lista de domínios permitidos (whitelist) do Zimbra (Preferências/E-mail/Permitir mensagens de). 

Se o domínio não for identificado, o hyperlink será removido da mensagem. 

Desenvolvido e testado para a versão 8.7.0 do Zimbra. 

Importante!
Este plugin é parcialmente baseado no projeto https://github.com/yartu/zimlet-blockhyperlink
