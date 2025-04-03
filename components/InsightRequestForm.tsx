'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const STAKEHOLDER_OPTIONS = [
  'Rylee Grace',
  'Lindsay Rothman',
  'Caroline Bertrand',
  'Roel Decoene',
  'Sarah Varki',
  'Ayman Salloom',
  'Barron Roth',
  'Helen Mou',
  'Saara Hafeez Malik',
  'Adam Davidson',
  'James Thomas',
  'Kenny Tung',
  'Kristen Fisher',
  'Lauren Soto',
  'Mia Vo',
  'Mike Barnlund',
  'N/A'
];

const CATEGORY_OPTIONS = [
  'Transactions',
  'In-Store',
  'HQ',
  'Foundations'
];

const formSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requester: z.string().min(1, 'Please select a stakeholder'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().min(1, 'Please select a due date'),
  category: z.string().min(1, 'Please select a category'),
});

type FormData = z.infer<typeof formSchema>;

export default function InsightRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stakeholderQuery, setStakeholderQuery] = useState('');
  const [selectedStakeholder, setSelectedStakeholder] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const filteredStakeholders = stakeholderQuery === ''
    ? STAKEHOLDER_OPTIONS
    : STAKEHOLDER_OPTIONS.filter((stakeholder) =>
        stakeholder.toLowerCase().includes(stakeholderQuery.toLowerCase())
      );

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Generate title using AI
      const titleResponse = await fetch(`${window.location.origin}/api/generate-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: data.description }),
      });

      if (!titleResponse.ok) {
        const errorData = await titleResponse.json();
        throw new Error(errorData.error || 'Failed to generate title');
      }

      const { title } = await titleResponse.json();

      // Submit the request
      const response = await fetch(`${window.location.origin}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }

      const result = await response.json();
      
      // Show success toast for Slack notification
      toast.success('🎉 Slack notification sent!', {
        duration: 3000,
      });

      reset();
      setSelectedStakeholder('');
      setStakeholderQuery('');
      
      // Trigger a custom event to refresh the request list
      window.dispatchEvent(new CustomEvent('requestSubmitted', { detail: result }));
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#002e25] p-6 border border-[#A5E3B9]/30">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[#CEC9F8] mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full px-3 py-2 bg-[#004c3f] border border-[#A5E3B9]/30 rounded-lg text-[#CEC9F8] focus:outline-none focus:ring-2 focus:ring-[#A5E3B9]/50"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="stakeholder" className="block text-sm font-medium text-[#CEC9F8]">
            Stakeholder
          </label>
          <Combobox 
            value={selectedStakeholder} 
            onChange={(value: string) => {
              setSelectedStakeholder(value);
              setValue('requester', value);
            }}
          >
            <div className="relative mt-1">
              <Combobox.Input
                className="w-full rounded-md border border-[#A5E3B9]/30 bg-[#002e25] py-2 pl-3 pr-10 text-[#A5E3B9] shadow-sm focus:border-[#A5E3B9] focus:outline-none focus:ring-1 focus:ring-[#A5E3B9] sm:text-sm"
                onChange={(event) => setStakeholderQuery(event.target.value)}
                displayValue={(stakeholder: string) => stakeholder}
                placeholder="Select or type a stakeholder name"
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                <ChevronUpDownIcon className="h-5 w-5 text-[#A5E3B9]" aria-hidden="true" />
              </Combobox.Button>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#002e25] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredStakeholders.length === 0 && stakeholderQuery !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-[#A5E3B9]">
                    No stakeholders found.
                  </div>
                ) : (
                  filteredStakeholders.map((stakeholder) => (
                    <Combobox.Option
                      key={stakeholder}
                      value={stakeholder}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-[#004c3f] text-[#FCF3B0]' : 'text-[#A5E3B9]'
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {stakeholder}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-[#FCF3B0]' : 'text-[#A5E3B9]'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
          {errors.requester && (
            <p className="mt-1 text-sm text-red-500">{errors.requester.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-[#CEC9F8]">
            Priority
          </label>
          <select
            id="priority"
            {...register('priority')}
            className="mt-1 block w-full rounded-md border border-[#A5E3B9]/30 bg-[#002e25] px-3 py-2 text-[#A5E3B9] shadow-sm focus:border-[#A5E3B9] focus:outline-none focus:ring-1 focus:ring-[#A5E3B9] sm:text-sm"
          >
            <option value="">Select priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-500">{errors.priority.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-[#CEC9F8]">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            {...register('dueDate')}
            className="mt-1 block w-full rounded-md border border-[#A5E3B9]/30 bg-[#002e25] px-3 py-2 text-[#A5E3B9] shadow-sm focus:border-[#A5E3B9] focus:outline-none focus:ring-1 focus:ring-[#A5E3B9] sm:text-sm"
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-500">{errors.dueDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-[#CEC9F8]">
            Category
          </label>
          <select
            id="category"
            {...register('category')}
            className="mt-1 block w-full rounded-md border border-[#A5E3B9]/30 bg-[#002e25] px-3 py-2 text-[#A5E3B9] shadow-sm focus:border-[#A5E3B9] focus:outline-none focus:ring-1 focus:ring-[#A5E3B9] sm:text-sm"
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#004c3f] px-4 py-2 text-sm font-medium text-[#FCF3B0] hover:bg-[#006b5a] focus:outline-none focus:ring-2 focus:ring-[#A5E3B9] focus:ring-offset-2 focus:ring-offset-[#002e25] disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
} 