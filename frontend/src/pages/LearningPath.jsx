import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Plus,
  Save,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { learningPathAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const FALLBACK_SUGGESTIONS = [
  'React',
  'Node.js',
  'MongoDB',
  'System Design',
  'AI Agents',
  'DevOps',
];

const getTaskKey = (milestone, task) => `${milestone.id}:${task.id}`;

const getOrderedTasks = (path) => path.milestones.flatMap((milestone) => milestone.tasks.map((task) => ({
  milestone,
  task,
  taskKey: getTaskKey(milestone, task),
})));

const getFirstIncompleteTaskKey = (path) => {
  const orderedTasks = getOrderedTasks(path);
  const firstIncompleteTask = orderedTasks.find(({ taskKey }) => !path.completedTasks?.[taskKey]);
  return firstIncompleteTask?.taskKey || null;
};

const LearningPath = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const userInterests = useMemo(
    () => (Array.isArray(user?.interests) ? user.interests.filter(Boolean) : []),
    [user?.interests],
  );
  const currentlyLearning = useMemo(
    () => (Array.isArray(user?.currentlyLearning) ? user.currentlyLearning.filter(Boolean) : []),
    [user?.currentlyLearning],
  );
  const suggestedTopics = useMemo(
    () => (
      currentlyLearning.length || userInterests.length
        ? [...currentlyLearning, ...userInterests]
        : FALLBACK_SUGGESTIONS
    ),
    [currentlyLearning, userInterests],
  );

  const [goal, setGoal] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [customTopics, setCustomTopics] = useState([]);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [draftPath, setDraftPath] = useState(null);
  const [activePathId, setActivePathId] = useState(null);
  const [error, setError] = useState('');

  const { data: learningPathData, isLoading: pathsLoading } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: learningPathAPI.getLearningPath,
  });

  const savedPaths = useMemo(
    () => learningPathData?.paths || [],
    [learningPathData?.paths],
  );

  useEffect(() => {
    setActivePathId((current) => (
      savedPaths.some((path) => path.id === current) ? current : savedPaths[0]?.id || null
    ));
  }, [savedPaths]);

  const allTopics = useMemo(
    () => [...new Set([...suggestedTopics, ...customTopics].map((topic) => topic.trim()).filter(Boolean))],
    [customTopics, suggestedTopics],
  );

  const activePath = savedPaths.find((path) => path.id === activePathId) || savedPaths[0] || null;

  const progress = useMemo(() => {
    if (!activePath) {
      return { completed: 0, total: 0, percent: 0 };
    }

    const tasks = activePath.milestones.flatMap((milestone) =>
      milestone.tasks.map((task) => getTaskKey(milestone, task)),
    );
    const completed = tasks.filter((taskKey) => activePath.completedTasks?.[taskKey]).length;

    return {
      completed,
      total: tasks.length,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }, [activePath]);

  const generateMutation = useMutation({
    mutationFn: () => learningPathAPI.generate({
      goal,
      durationWeeks,
      interests: [...currentlyLearning, ...userInterests],
    }),
    onSuccess: (response) => {
      const data = response?.data || response;

      if (!data?.path) {
        setDraftPath(null);
        setError('Could not generate a learning path.');
        return;
      }

      console.log('Generated path:', data);

      setError('');
      setDraftPath(data.path);
    },
    onError: (mutationError) => {
      setDraftPath(null);
      setError(mutationError.response?.data?.error || 'Could not generate a learning path. Try a clearer topic.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (path) => learningPathAPI.create(path),
    onSuccess: (savedPath) => {
      if (savedPath.topic) {
        setUser((currentUser) => currentUser
          ? {
            ...currentUser,
            currentlyLearning: [
              ...new Set([...(currentUser.currentlyLearning || []), savedPath.topic]),
            ],
          }
          : currentUser);
      }
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setActivePathId(savedPath.id);
      setDraftPath(null);
      setGoal('');
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.error || 'Could not save the approved path.');
    },
  });

  const progressMutation = useMutation({
    mutationFn: ({ pathId, completedTasks }) => learningPathAPI.complete(pathId, { completedTasks }),
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.error || 'Could not update this path.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (pathId) => learningPathAPI.delete(pathId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.error || 'Could not delete this path.');
    },
  });

  const addCustomTopic = () => {
    const nextTopic = customTopic.trim();
    if (!nextTopic) {
      return;
    }

    setCustomTopics((current) => [...new Set([...current, nextTopic])]);
    setGoal(nextTopic);
    setCustomTopic('');
    setDraftPath(null);
  };

  const approveDraft = () => {
    if (!draftPath) {
      return;
    }

    const approvedPath = {
      ...draftPath,
      approvedAt: new Date().toISOString(),
      completedTasks: {},
    };

    approveMutation.mutate(approvedPath);
  };

  const toggleTask = (pathId, taskKey) => {
    const path = savedPaths.find((entry) => entry.id === pathId);
    if (!path) {
      return;
    }

    progressMutation.mutate({
      pathId: path._id,
      completedTasks: {
        ...(path.completedTasks || {}),
        [taskKey]: !path.completedTasks?.[taskKey],
      },
    });
  };

  const deletePath = (pathId) => {
    const path = savedPaths.find((entry) => entry.id === pathId);
    if (!path) {
      return;
    }

    setActivePathId(savedPaths.find((entry) => entry.id !== pathId)?.id || null);
    if (path.topic && !path.completedAt) {
      setUser((currentUser) => currentUser
        ? {
          ...currentUser,
          currentlyLearning: (currentUser.currentlyLearning || []).filter((topic) => topic !== path.topic),
        }
        : currentUser);
    }
    deleteMutation.mutate(path._id);
  };

  const completeActivePath = () => {
    if (!activePath) {
      return;
    }

    progressMutation.mutate({
      pathId: activePath._id,
      completedTasks: activePath.completedTasks || {},
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personalized Learning Path</h1>
            <p className="text-gray-600">Choose a topic, approve the AI plan, and track your progress.</p>
          </div>
        </div>
        {activePath && (
          <Badge variant="info">
            {progress.completed}/{progress.total} tasks done
          </Badge>
        )}
      </div>

      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Suggested topics</h2>
            <div className="flex flex-wrap gap-2">
              {allTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setGoal(topic);
                    setDraftPath(null);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${goal === topic
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <Input
              label="Add your own topic"
              placeholder="e.g. GraphQL with React"
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomTopic();
                }
              }}
            />
            <Button variant="outline" onClick={addCustomTopic} disabled={!customTopic.trim()} className="lg:h-10.5">
              <Plus size={16} className="mr-2" />
              Add Topic
            </Button>
          </div> */}

          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
            <Input
              label="Topic to learn"
              placeholder="Select a suggestion or type your own"
              value={goal}
              onChange={(event) => {
                setGoal(event.target.value);
                setDraftPath(null);
              }}
            />
            <Input
              label="Duration (in Weeks)"
              type="number"
              min="1"
              max="52"
              value={durationWeeks}
              onChange={(event) => setDurationWeeks(event.target.value)}
            />
            <Button
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              disabled={!goal.trim()}
              className="md:h-10.5"
            >
              <Sparkles size={16} className="mr-2" />
              Create Path
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </Card>

      {draftPath && (
        <Card className="border-primary-200 bg-primary-50 p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="primary">Draft</Badge>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">{draftPath.title}</h2>
              <p className="mt-1 text-sm text-gray-700">
                {draftPath.durationWeeks} weeks | {draftPath.totalHours} estimated hours | {draftPath.level}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDraftPath(null)}>Discard</Button>
              <Button onClick={approveDraft} loading={approveMutation.isPending}>
                <Save size={16} className="mr-2" />
                Approve Plan
              </Button>
            </div>
          </div>

          {draftPath.assumptions?.length > 0 && (
            <div className="mb-4 rounded-lg bg-white p-4 text-sm text-gray-700">
              <p className="mb-2 font-medium text-gray-900">Assumptions</p>
              <ul className="list-disc space-y-1 pl-5">
                {draftPath.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </div>
          )}

          <PathMilestones path={draftPath} />
        </Card>
      )}

      {pathsLoading && (
        <Card className="p-12 text-center">
          <Spinner size="lg" />
        </Card>
      )}

      {!pathsLoading && savedPaths.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Saved paths</h2>
            <div className="space-y-2">
              {savedPaths.map((path) => (
                <button
                  key={path.id}
                  type="button"
                  onClick={() => setActivePathId(path.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${activePath?.id === path.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                >
                  <p className="font-medium text-gray-900">{path.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{path.durationWeeks} weeks</p>
                </button>
              ))}
            </div>
          </Card>

          {activePath && (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{activePath.title}</h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      {activePath.durationWeeks} weeks | {activePath.totalHours} estimated hours
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {progress.percent === 100 && !activePath.completedAt && (
                      <Button
                        size="sm"
                        onClick={completeActivePath}
                        loading={progressMutation.isPending}
                      >
                        <CheckCircle2 size={16} className="mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deletePath(activePath.id)}
                      loading={deleteMutation.isPending}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                {activePath.completedAt && (
                  <div className="mb-3 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                    Completed
                  </div>
                )}

                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-primary-600 transition-all"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{progress.percent}% complete</p>
              </Card>

              <PathMilestones path={activePath} onToggleTask={toggleTask} />
            </div>
          )}
        </div>
      )}

      {!pathsLoading && !draftPath && savedPaths.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900">No approved path yet</h2>
          <p className="mt-2 text-gray-600">Create a path and approve the draft to start tracking your learning.</p>
        </Card>
      )}
    </div>
  );
};

const PathMilestones = ({ path, onToggleTask }) => (
  <div className="space-y-4">
    {path.milestones.map((milestone) => (
      <div key={milestone.id} className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="info">Week {milestone.week}</Badge>
          <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
        </div>
        {milestone.objective && (
          <p className="mb-4 text-sm leading-6 text-gray-600">{milestone.objective}</p>
        )}

        <div className="space-y-3">
          {milestone.tasks.map((task) => {
            const taskKey = getTaskKey(milestone, task);
            const isCompleted = Boolean(path.completedTasks?.[taskKey]);
            const firstIncompleteTaskKey = getFirstIncompleteTaskKey(path);
            const isLocked = !isCompleted && firstIncompleteTaskKey !== null && taskKey !== firstIncompleteTaskKey;
            const isNextTask = !isCompleted && taskKey === firstIncompleteTaskKey;

            return (
              <div key={task.id} className={`rounded-lg border p-4 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'} ${isLocked ? 'opacity-70' : ''}`}>
                <div className="flex items-start gap-3">
                  {onToggleTask ? (
                    <button
                      type="button"
                      onClick={() => onToggleTask(path.id, taskKey)}
                      disabled={isLocked}
                      className="mt-0.5 text-gray-500 hover:text-primary-600"
                      aria-label={isCompleted ? 'Mark task pending' : 'Mark task complete'}
                    >
                      {isCompleted ? <CheckCircle2 size={22} className="text-green-600" /> : <Square size={22} />}
                    </button>
                  ) : (
                    <Square size={22} className="mt-0.5 text-gray-400" />
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`font-semibold ${isCompleted ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
                      <Badge variant={isCompleted ? 'success' : 'default'}>{task.estimatedHours}h</Badge>
                      {isNextTask && !isCompleted && (
                        <Badge variant="info">Next</Badge>
                      )}
                      {isLocked && (
                        <Badge variant="default">Locked</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{task.description}</p>
                    {task.deliverable && (
                      <p className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Deliverable:</span> {task.deliverable}
                      </p>
                    )}
                    {task.resourceQuery && (
                      <p className="mt-1 text-sm text-gray-500">
                        Search: {task.resourceQuery}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

export default LearningPath;
