import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Compass, ThumbsDown, ThumbsUp } from 'lucide-react';
import { learningPathAPI } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import { formatDate } from '../utils/date';

const LearningPath = () => {
  const queryClient = useQueryClient();
  const [goal, setGoal] = useState('');

  const { data: path, isLoading } = useQuery({
    queryKey: ['learning-path'],
    queryFn: () => learningPathAPI.getLearningPath(),
  });

  const createMutation = useMutation({
    mutationFn: () => learningPathAPI.create(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (pathId) => learningPathAPI.complete(pathId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path'] });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ pathId, postId, helpful }) => learningPathAPI.feedback(pathId, postId, helpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path'] });
    },
  });

  const progress = useMemo(() => {
    if (!path?.steps?.length) {
      return 0;
    }

    const completed = path.steps.filter((step) => step.status === 'completed').length;
    return Math.round((completed / path.steps.length) * 100);
  }, [path]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentStep = path?.steps?.find((step) => step.order === path.currentStep) || null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen size={28} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personalized Learning Path</h1>
          <p className="text-gray-600">Goal to resources to progress tracking, kept simple and working.</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Input
            label="Learning Goal"
            placeholder="Learn MERN stack"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!goal.trim()}
            className="md:h-[42px]"
          >
            Create Path
          </Button>
        </div>
      </Card>

      {!path ? (
        <Card className="p-12 text-center">
          <div className="mb-4 text-6xl">📚</div>
          <h2 className="text-xl font-semibold text-gray-900">No learning path yet</h2>
          <p className="mt-2 text-gray-600">
            Add a goal above and we will build a simple ordered path from relevant posts.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{path.goal}</h2>
                <Badge variant="info">{progress}% complete</Badge>
              </div>

              <div className="mb-4 h-3 w-full rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-primary-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-sm text-gray-600">
                Current step: {Math.min(path.currentStep, path.steps.length)} of {path.steps.length}
              </p>
              <p className="mt-1 text-sm text-gray-500">Created on {formatDate(path.createdAt)}</p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <Compass size={20} className="text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Next Step</h2>
              </div>

              {currentStep ? (
                <div className="space-y-3">
                  <Badge variant="primary">Step {currentStep.order}</Badge>
                  <h3 className="font-semibold text-gray-900">{currentStep.postId?.title || 'Resource unavailable'}</h3>
                  <p className="text-sm text-gray-600">
                    Focus on this resource next to keep moving toward your goal.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  You completed all steps in this path. Create a new goal when you want the next track.
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            {path.steps.map((step) => {
              const isCompleted = step.status === 'completed';
              const helpful = step.helpful;

              return (
                <Card key={step.order} className={`p-6 ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                      {isCompleted ? <CheckCircle2 size={20} className="text-green-600" /> : step.order}
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{step.postId?.title || `Step ${step.order}`}</h3>
                        <Badge variant={isCompleted ? 'success' : 'info'}>
                          {isCompleted ? 'Completed' : 'Pending'}
                        </Badge>
                        {helpful === true && <Badge variant="success">Helpful</Badge>}
                        {helpful === false && <Badge variant="danger">Not Helpful</Badge>}
                      </div>

                      {step.postId?.tldr && (
                        <p className="mb-3 text-sm leading-6 text-gray-700">{step.postId.tldr}</p>
                      )}

                      {step.postId?._id && (
                        <a
                          href={`/app/post/${step.postId._id}`}
                          className="mb-4 inline-block text-sm font-medium text-primary-600 hover:underline"
                        >
                          Open resource
                        </a>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {!isCompleted && step.order === path.currentStep && (
                          <Button
                            size="sm"
                            onClick={() => completeMutation.mutate(path._id)}
                            loading={completeMutation.isPending}
                          >
                            Mark Complete
                          </Button>
                        )}

                        {step.postId?._id && (
                          <>
                            <Button
                              size="sm"
                              variant={helpful === true ? 'primary' : 'ghost'}
                              onClick={() => feedbackMutation.mutate({
                                pathId: path._id,
                                postId: step.postId._id,
                                helpful: true,
                              })}
                              loading={
                                feedbackMutation.isPending
                                && feedbackMutation.variables?.postId === step.postId._id
                                && feedbackMutation.variables?.helpful === true
                              }
                            >
                              <ThumbsUp size={16} className="mr-2" />
                              Helpful
                            </Button>

                            <Button
                              size="sm"
                              variant={helpful === false ? 'danger' : 'ghost'}
                              onClick={() => feedbackMutation.mutate({
                                pathId: path._id,
                                postId: step.postId._id,
                                helpful: false,
                              })}
                              loading={
                                feedbackMutation.isPending
                                && feedbackMutation.variables?.postId === step.postId._id
                                && feedbackMutation.variables?.helpful === false
                              }
                            >
                              <ThumbsDown size={16} className="mr-2" />
                              Not Helpful
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LearningPath;
