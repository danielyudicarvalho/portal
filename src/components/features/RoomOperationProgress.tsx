'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { LoadingSpinner, ProgressBar } from './LoadingStates';

export type RoomOperationType = 'creating' | 'joining' | 'connecting' | 'loading';

interface RoomOperationStep {
  id: string;
  label: string;
  duration: number; // in milliseconds
  completed: boolean;
}

interface RoomOperationProgressProps {
  operation: RoomOperationType;
  isVisible: boolean;
  onCancel?: () => void;
  customSteps?: RoomOperationStep[];
  className?: string;
}

const DEFAULT_STEPS: Record<RoomOperationType, RoomOperationStep[]> = {
  creating: [
    { id: 'validate', label: 'Validating room settings...', duration: 1000, completed: false },
    { id: 'server', label: 'Contacting game server...', duration: 2000, completed: false },
    { id: 'room', label: 'Creating room...', duration: 1500, completed: false },
    { id: 'code', label: 'Generating room code...', duration: 500, completed: false },
  ],
  joining: [
    { id: 'validate', label: 'Validating room code...', duration: 800, completed: false },
    { id: 'locate', label: 'Locating room...', duration: 1200, completed: false },
    { id: 'connect', label: 'Connecting to room...', duration: 1500, completed: false },
    { id: 'join', label: 'Joining room...', duration: 1000, completed: false },
  ],
  connecting: [
    { id: 'server', label: 'Connecting to server...', duration: 2000, completed: false },
    { id: 'lobby', label: 'Joining lobby...', duration: 1500, completed: false },
    { id: 'sync', label: 'Syncing room data...', duration: 1000, completed: false },
  ],
  loading: [
    { id: 'fetch', label: 'Loading rooms...', duration: 1500, completed: false },
    { id: 'process', label: 'Processing data...', duration: 800, completed: false },
    { id: 'render', label: 'Preparing display...', duration: 500, completed: false },
  ],
};

export const RoomOperationProgress: React.FC<RoomOperationProgressProps> = ({
  operation,
  isVisible,
  onCancel,
  customSteps,
  className = '',
}) => {
  const [steps, setSteps] = useState<RoomOperationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize steps when operation changes
  useEffect(() => {
    if (isVisible) {
      const initialSteps = customSteps || DEFAULT_STEPS[operation] || [];
      setSteps(initialSteps.map(step => ({ ...step, completed: false })));
      setCurrentStepIndex(0);
      setProgress(0);
      setElapsedTime(0);
    }
  }, [operation, isVisible, customSteps]);

  // Progress simulation
  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 100);
      
      // Calculate progress based on current step
      const currentStep = steps[currentStepIndex];
      if (!currentStep) return;

      const stepProgress = Math.min(elapsedTime / currentStep.duration, 1);
      const baseProgress = (currentStepIndex / steps.length) * 100;
      const currentStepProgress = (stepProgress / steps.length) * 100;
      const totalProgress = baseProgress + currentStepProgress;

      setProgress(totalProgress);

      // Move to next step when current step is complete
      if (stepProgress >= 1 && currentStepIndex < steps.length - 1) {
        setSteps(prev => prev.map((step, index) => 
          index === currentStepIndex ? { ...step, completed: true } : step
        ));
        setCurrentStepIndex(prev => prev + 1);
        setElapsedTime(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, steps, currentStepIndex, elapsedTime]);

  if (!isVisible) return null;

  const operationLabels = {
    creating: 'Creating Room',
    joining: 'Joining Room',
    connecting: 'Connecting',
    loading: 'Loading Rooms',
  };

  const currentStep = steps[currentStepIndex];
  const isComplete = progress >= 100;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            {isComplete ? (
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <LoadingSpinner size="lg" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {operationLabels[operation]}
          </h3>
          <p className="text-gray-600 text-sm">
            {isComplete ? 'Complete!' : currentStep?.label || 'Processing...'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <ProgressBar progress={progress} showPercentage />
        </div>

        {/* Step list */}
        <div className="space-y-2 mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-3 text-sm ${
                index === currentStepIndex
                  ? 'text-blue-600'
                  : step.completed
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : index === currentStepIndex ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <div className="w-4 h-4 border-2 border-current rounded-full opacity-30" />
                )}
              </div>
              <span>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Cancel button */}
        {onCancel && !isComplete && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Cancel
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

interface QuickLoadingProps {
  operation: RoomOperationType;
  message?: string;
  className?: string;
}

export const QuickLoading: React.FC<QuickLoadingProps> = ({
  operation,
  message,
  className = '',
}) => {
  const defaultMessages = {
    creating: 'Creating room...',
    joining: 'Joining room...',
    connecting: 'Connecting...',
    loading: 'Loading...',
  };

  return (
    <div className={`flex items-center justify-center space-x-3 py-8 ${className}`}>
      <LoadingSpinner size="md" />
      <span className="text-gray-600">
        {message || defaultMessages[operation]}
      </span>
    </div>
  );
};

export default RoomOperationProgress;