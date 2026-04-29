import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle, RefreshCw, Target } from 'lucide-react';
import { learningPathAPI } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import { formatDate } from '../utils/date';
import { useState } from 'react';

const LearningPath = () => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    skillLevel: '',
    career: '',
    targetRole: '',
    timePerWeek: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['learning-path'],
    queryFn: () => learningPathAPI.getLearningPath(),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => learningPathAPI.regenerate(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries(['learning-path']);
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ pathId, step }) => learningPathAPI.completeItem(pathId, step),
    onSuccess: () => {
      queryClient.invalidateQueries(['learning-path']);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const path = data?.path;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen size={28} className="mr-3 text-primary-600" />
            Your Learning Path
          </h1>
          <p className="text-gray-600 mt-1">AI-generated personalized learning journey</p>
        </div>
        <Button
          onClick={() => regenerateMutation.mutate()}
          loading={regenerateMutation.isPending}
          variant="outline"
        >
          <RefreshCw size={18} className="mr-2" />
          Regenerate
        </Button>
      </div>

      {!path ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Learning Path Yet</h3>
          <p className="text-gray-600 mb-6">
            We'll generate a personalized learning path based on your interests and activity
          </p>
          <Button onClick={() => regenerateMutation.mutate()} loading={regenerateMutation.isPending}>
            Generate Learning Path
          </Button>
        </Card>
      ) : (
        <>
          {}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Progress Overview</h2>
              <Badge variant="info">
                {path.completedSteps?.length || 0} / {path.steps?.length || 0} completed
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <Input
                label="Skill level override"
                placeholder="beginner / intermediate / advanced"
                value={preferences.skillLevel}
                onChange={(event) => setPreferences((prev) => ({ ...prev, skillLevel: event.target.value }))}
              />
              <Input
                label="Career goal"
                placeholder="frontend engineer"
                value={preferences.career}
                onChange={(event) => setPreferences((prev) => ({ ...prev, career: event.target.value }))}
              />
              <Input
                label="Target role"
                placeholder="AI engineer"
                value={preferences.targetRole}
                onChange={(event) => setPreferences((prev) => ({ ...prev, targetRole: event.target.value }))}
              />
              <Input
                label="Time per week"
                placeholder="6 hours"
                value={preferences.timePerWeek}
                onChange={(event) => setPreferences((prev) => ({ ...prev, timePerWeek: event.target.value }))}
              />
            </div>

            {}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all"
                style={{
                  width: `${((path.completedSteps?.length || 0) / (path.steps?.length || 1)) * 100}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Last updated: {formatDate(path.updatedAt)}</span>
              <span>{Math.round(((path.completedSteps?.length || 0) / (path.steps?.length || 1)) * 100)}% complete</span>
            </div>
          </Card>

          {}
          <div className="space-y-4">
            {path.steps?.map((step, index) => {
              const isCompleted = path.completedSteps?.includes(step.step);
              
              return (
                <Card key={index} className={`p-6 ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                  <div className="flex items-start space-x-4">
                    {}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle size={24} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="font-semibold text-gray-700">{index + 1}</span>
                        </div>
                      )}
                    </div>

                    {}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-700 mb-4">{step.description}</p>

                      {}
                      {step.relatedPosts && step.relatedPosts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-600">Recommended Resources:</p>
                          <div className="space-y-2">
                            {step.relatedPosts.map((post) => (
                              <a
                                key={post._id}
                                href={`/app/post/${post._id}`}
                                className="flex items-center space-x-2 text-sm text-primary-600 hover:underline"
                              >
                                <Target size={14} />
                                <span>{post.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {}
                      {!isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => completeMutation.mutate({ pathId: path._id, step: step.step })}
                          loading={completeMutation.isPending}
                          className="mt-4"
                        >
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {}
          {path.completedSteps?.length === path.steps?.length && (
            <Card className="p-8 text-center bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
              <p className="text-gray-700 mb-6">
                You've completed your learning path. Ready for a new challenge?
              </p>
              <Button onClick={() => regenerateMutation.mutate()} loading={regenerateMutation.isPending}>
                Generate New Path
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default LearningPath;
