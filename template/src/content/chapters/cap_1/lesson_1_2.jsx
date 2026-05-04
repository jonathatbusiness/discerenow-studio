export default {
  chapterId: "1",
  lessonId: "2",
  chapterName: "O método Pomodoro na prática",
  name: "Como aplicar no dia a dia",
  blocks: [
    {
      blockType: "paragraph",
      theme: "noturno3",
      textAlign: "justify",
      fontSize: "16px",
      content: [
        "Saber o que é o método é só metade do trabalho. A outra metade é integrá-lo à sua rotina de um jeito que sobreviva aos dias ruins, quando tudo quer te puxar para fora do ciclo."
      ]
    },
    {
      blockType: "quiz",
      theme: "noturno3",
      textAlign: "left",
      fontSize: "16px",
      question: "Pergunta",
      type: "single",
      options: [
        "Opção 1",
        "Opção 2",
        "Opção 3",
        "Nova opção"
      ],
      correctAnswers: [
        "Opção 1"
      ],
      feedbackCorrect: "Resposta correta! Parabéns.",
      feedbackIncorrect: "Tipo do quiz — use \"single\" para resposta única ou \"multiple\" para múltiplas respostas. Pergunta Opção Opção Opção Opção Feedback correto Feedback incorreto Não foi dessa vez. Tente de novo!"
    },
    {
      blockType: "video",
      theme: "noturno3",
      textAlign: "center",
      fontSize: "14px",
      link: "https://www.youtube.com/live/pbYd8DgRt18?si=aw7PKzZnGEcm8a2A",
      videoSubtitle: "Legenda do vídeo (opcional)"
    },
    {
      blockType: "callout",
      theme: "noturno3",
      textAlign: "left",
      fontSize: "16px",
      icon: "info",
      title: "Fique ligado",
      content: "Este é um card de info."
    },
    {
      blockType: "continueButton",
      buttonText: "Continuar",
      isEndOfLesson: true,
      theme: "noturno3"
    },
    {
      blockType: "video",
      theme: "noturno3",
      textAlign: "center",
      fontSize: "14px",
      link: "https://www.youtube.com/watch?v=...",
      videoSubtitle: "Legenda do vídeo (opcional)"
    },
    {
      blockType: "cards",
      theme: "noturno3",
      textAlign: "left",
      fontSize: "15px",
      items: [
        {
          title: "Título do cartão",
          content: "Conteúdo do cartão",
          img: "/img/o-metodo-pomodoro-na-pratica/img-4.jpg",
          altText: "",
          subtitle: "",
          zoom: "no"
        }
      ]
    },
    {
      blockType: "flipcard",
      theme: "noturno3",
      textAlign: "center",
      fontSize: "15px",
      items: [
        {
          title: "Frente — título",
          content: "Frente — conteúdo...",
          img: "",
          altText: "",
          backTitle: "",
          backContent: "Verso — conteúdo...",
          backImg: "/img/o-metodo-pomodoro-na-pratica/img-5.jpeg",
          backAltText: ""
        }
      ]
    },
    {
      blockType: "quiz",
      theme: "noturno3",
      textAlign: "left",
      fontSize: "16px",
      question: "Quiz question?",
      type: "single",
      options: [
        "Option 1",
        "Option 2",
        "Option 3"
      ],
      correctAnswers: [
        "Option 2"
      ],
      feedbackCorrect: "Correct answer! Well done.",
      feedbackIncorrect: "Not this time. Try again!"
    },
    {
      blockType: "imgText",
      theme: "noturno3",
      imageSide: "left",
      zoom: "no",
      textAlign: "left",
      fontSize: "16px",
      image: "",
      altText: "",
      imgSubtitle: "",
      content: [
        "[Insert image here]",
        "Text beside the image..."
      ]
    }
  ]
};
