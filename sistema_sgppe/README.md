# SGPPE - Sistema de Gerenciamento de Projetos para Pequenas Empresas

SGPPE - Sistema de Gerenciamento de Projetos para Pequenas Empresas, desenvolvido durante meu Trabalho de Conclusão de Curso, consistiu no desenvolvimento de um software destinado ao gerenciamento de projetos em pequenas empresas. Este software surgiu como resposta às dificuldades enfrentadas por pequenos negócios na gestão de projetos.

## Metodologia

A metodologia do projeto incluiu pesquisa bibliográfica, complementada pelo uso de ferramentas avançadas para o desenvolvimento de software. O processo englobou desde a formulação teórica até a implementação prática, com um forte enfoque em metodologias de engenharia de software, abrangendo comunicação, planejamento, modelagem e construção.

Durante a modelagem, a metodologia adotada integrou análise de requisitos e prototipagem, buscando agilidade e precisão no desenvolvimento. A arquitetura do software seguiu o modelo Modelo-Visão-Controlador (MVC), com a interface do usuário (Visão) desenvolvida em HTML e CSS usando Bootstrap, o backend (Modelo) utilizando JavaScript e MySQL, e o Controlador responsável por gerenciar as interações entre a Visão e o Modelo.

## Resultados

O resultado foi um protótipo funcional que oferece uma plataforma eficiente e intuitiva para o gerenciamento de projetos. Além disso, o software desenvolvido foi registrado no INPI, reforçando seu potencial inovador para o segmento de pequenas empresas.

## Diagrama de Classe

![Diagrama de Classe do Sistema Proposto](https://github.com/noroefe/portfolio/blob/main/sistema_sgppe/diagrama%20de%20classe.png)

## Diagrama de Entidade Relacionamento

![Diagrama de Entidade Relacionamento do Software Proposto](https://github.com/noroefe/portfolio/blob/main/sistema_sgppe/diagrama_er.png)
Fonte: o autor (2023).

## Interface do Usuário

### Tela de Projetos Abertos

![Tela de Projetos Abertos](https://github.com/noroefe/portfolio/blob/main/sistema_sgppe/tela_projetos_aberots.png)

### Tela Cadastro de Projetos

![Tela Cadastro de Projetos](https://github.com/noroefe/portfolio/blob/main/sistema_sgppe/tela_novo_projeto.png)

## Instalação

### Pré-requisitos

1. **Node.js**: O Node.js será responsável pelo backend do sistema e pode ser baixado através do [link oficial](https://nodejs.org/en).
2. **MySQL**: O banco de dados MySQL pode ser baixado através do [link oficial](https://www.mysql.com/).

### Configuração do Banco de Dados

O arquivo contendo a descrição do código que irá gerar o banco de dados se encontra na pasta `db`, arquivo `db.sql`.

### Instalação das Dependências

Instalar todas as dependências contidas no arquivo `package.json`:

```bash
npm install

