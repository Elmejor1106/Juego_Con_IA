import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SuccessModal from '../../components/common/SuccessModal';

const GameEditorScreen = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState({
    title: '',
    description: '',
    is_public: false,
    template_id: parseInt(templateId),
    questions: [],
  });
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const createNewQuestion = () => ({
    question_text: '',
    order: game.questions.length,
    answers: [{ answer_text: '', is_correct: true, order: 0 }, { answer_text: '', is_correct: false, order: 1 }],
  });

  useEffect(() => {
    const fetchTemplate = async () => {
      const result = await GameViewModel.getTemplates();
      if (result.success) {
        const foundTemplate = result.templates.find(t => t.id === parseInt(templateId));
        setTemplate(foundTemplate);
        if (foundTemplate.name === 'Cuestionario') {
          setGame(g => ({ ...g, questions: [createNewQuestion()] }));
        }
      } else {
        setError('No se pudo cargar la plantilla.');
      }
      setIsLoading(false);
    };
    fetchTemplate();
  }, [templateId]);

  const handleGameChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGame({ ...game, [name]: type === 'checkbox' ? checked : value });
  };

  const handleQuestionChange = (qIndex, e) => {
    const { name, value } = e.target;
    const newQuestions = [...game.questions];
    newQuestions[qIndex][name] = value;
    setGame({ ...game, questions: newQuestions });
  };

  const handleAnswerChange = (qIndex, aIndex, e) => {
    const { name, value } = e.target;
    const newQuestions = [...game.questions];
    if (name === 'is_correct') {
      newQuestions[qIndex].answers.forEach((ans, i) => {
        newQuestions[qIndex].answers[i].is_correct = i === aIndex;
      });
    } else {
        newQuestions[qIndex].answers[aIndex][name] = value;
    }
    setGame({ ...game, questions: newQuestions });
  };

  const addQuestion = () => {
    setGame({ ...game, questions: [...game.questions, createNewQuestion()] });
  };

  const removeQuestion = (qIndex) => {
    const newQuestions = game.questions.filter((_, i) => i !== qIndex);
    setGame({ ...game, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await GameViewModel.createGame(game);
    setIsLoading(false);
    if (result.success) {
      setShowSuccessModal(true);
    } else {
      setError(result.error || 'Ocurrió un error al guardar el juego.');
    }
  };
  
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/user-games');
  };

  if (isLoading) return <div className="text-center p-10 text-slate-500">Cargando editor...</div>;
  if (error) return <div className="text-red-600 bg-red-100 p-4 rounded-lg border border-red-200">{error}</div>;

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Editor de Juego</h1>
            <p className="text-slate-500 mt-1">
                Plantilla: <span className="font-semibold text-sky-600">{template?.name}</span>
            </p>
        </div>
        <Button onClick={() => navigate(-1)} className="bg-slate-500 hover:bg-slate-600 text-white">
            Volver
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
            <Card className="bg-white shadow-lg rounded-lg border border-slate-200">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3">Detalles del Juego</h2>
                <div className="space-y-4 mt-4">
                  <Input name="title" value={game.title} onChange={handleGameChange} placeholder="Título del Juego" required />
                  <textarea name="description" value={game.description} onChange={handleGameChange} placeholder="Añade una descripción..." className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-400 transition" rows="3"/>
                  <div className="flex items-center">
                      <input type="checkbox" name="is_public" checked={game.is_public} onChange={handleGameChange} id="is_public" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"/>
                      <label htmlFor="is_public" className="ml-2 block text-sm text-slate-700">Hacer Público</label>
                  </div>
                </div>
              </div>
            </Card>

            {template?.name === 'Cuestionario' && (
              <Card className="bg-white shadow-lg rounded-lg border border-slate-200">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3">Preguntas y Respuestas</h2>
                  <div className="space-y-6 mt-4">
                      {game.questions.map((q, qIndex) => (
                        <div key={qIndex} className="border bg-slate-50/70 p-4 rounded-md">
                          <Input name="question_text" value={q.question_text} onChange={(e) => handleQuestionChange(qIndex, e)} placeholder={`Texto de la Pregunta ${qIndex + 1}`} required />
                          <div className="mt-4 ml-4 space-y-3 border-l-2 border-sky-200 pl-4">
                            {q.answers.map((a, aIndex) => (
                              <div key={aIndex} className="flex items-center">
                                <input type="radio" name={`is_correct_${qIndex}`} checked={a.is_correct} onChange={(e) => handleAnswerChange(qIndex, aIndex, e)} className="w-4 h-4 mr-3 text-emerald-500 focus:ring-emerald-400"/>
                                <Input name="answer_text" value={a.answer_text} onChange={(e) => handleAnswerChange(qIndex, aIndex, e)} placeholder={`Respuesta ${aIndex + 1}`} required className="flex-grow"/>
                              </div>
                            ))}
                          </div>
                          <div className="text-right mt-4">
                            <Button type="button" onClick={() => removeQuestion(qIndex)} className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded-md shadow-sm">
                              Eliminar Pregunta
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <Button type="button" onClick={addQuestion} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md">
                      Añadir Pregunta
                    </Button>
                  </div>
                </div>
              </Card>
            )}
        </div>

        <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-3 shadow-lg hover:shadow-xl">
                {isLoading ? 'Guardando...' : 'Guardar Juego'}
            </Button>
        </div>
      </form>
      {showSuccessModal && <SuccessModal message="Tu juego ha sido creado exitosamente." onDone={handleCloseModal} />}
    </div>
  );
};

export default GameEditorScreen;
