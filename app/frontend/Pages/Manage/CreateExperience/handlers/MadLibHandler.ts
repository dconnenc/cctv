import { BlockStatus, ParticipantSummary } from '@cctv/types';

import { MadLibData } from '../types';
import { BaseBlockHandler } from './BaseBlockHandler';

export class MadLibHandler extends BaseBlockHandler<MadLibData> {
  private participants: ParticipantSummary[];

  constructor(participants: ParticipantSummary[]) {
    super({
      segments: [{ id: '1', type: 'text', content: 'The ' }],
      variables: [],
    });
    this.participants = participants;
  }

  getDefaultState(): MadLibData {
    return {
      segments: [{ id: '1', type: 'text', content: 'The ' }],
      variables: [],
    };
  }

  validate(): string | null {
    const validSegments = this.data.segments.filter((s) => s.content.trim());

    if (validSegments.length === 0) {
      return 'Mad lib must have at least one segment';
    }

    const validVariables = this.data.variables.filter((v) => v.name.trim() && v.question.trim());
    const variableSegments = validSegments.filter((s) => s.type === 'variable');

    if (variableSegments.length > 0 && validVariables.length === 0) {
      return 'Variables must have both name and question configured';
    }

    return null;
  }

  canOpenImmediately(participants: ParticipantSummary[]): boolean {
    const validVariables = this.data.variables.filter((v) => v.name.trim() && v.question.trim());
    const unassignedVariables = validVariables.filter(
      (v) => !v.assigned_user_id || v.assigned_user_id === 'random',
    );

    // Check if we have enough participants for random assignments
    if (unassignedVariables.length > 0) {
      const availableParticipants = participants.filter(
        (p) => !validVariables.some((v) => v.assigned_user_id === p.user_id),
      );

      // Need enough participants for all unassigned variables
      return availableParticipants.length >= unassignedVariables.length;
    }

    return true;
  }

  processBeforeSubmit(status: BlockStatus, participants: ParticipantSummary[]): void {
    // Handle random assignments
    const validVariables = [
      ...this.data.variables.filter((v) => v.name.trim() && v.question.trim()),
    ];
    const availableParticipants = participants.filter(
      (p) => !validVariables.some((v) => v.assigned_user_id === p.user_id),
    );

    // Process random assignments
    for (let i = 0; i < validVariables.length; i++) {
      const variable = validVariables[i];
      if (variable.assigned_user_id === 'random' && availableParticipants.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableParticipants.length);
        const assignedParticipant = availableParticipants.splice(randomIndex, 1)[0];
        validVariables[i] = {
          ...variable,
          assigned_user_id: assignedParticipant.user_id,
        };
      }
    }

    // Update the data with processed assignments
    this.updateData({ variables: validVariables });
  }

  buildPayload(): Record<string, any> {
    const validSegments = this.data.segments.filter((s) => s.content.trim());
    const validVariables = this.data.variables.filter((v) => v.name.trim() && v.question.trim());

    return {
      type: 'mad_lib',
      segments: validSegments,
      variables: validVariables,
    };
  }

  // Helper methods for mad lib specific operations
  addTextSegment(content: string = ' '): void {
    const newId = Date.now().toString();
    const newSegments = [...this.data.segments, { id: newId, type: 'text' as const, content }];
    this.updateData({ segments: newSegments });
  }

  addVariableSegment(): void {
    const newVariableId = Date.now().toString();
    const newSegmentId = (Date.now() + 1).toString();

    const newVariable = {
      id: newVariableId,
      name: 'variable',
      question: 'Enter a word',
      dataType: 'text' as const,
      assigned_user_id: undefined,
    };

    const newSegment = {
      id: newSegmentId,
      type: 'variable' as const,
      content: newVariableId,
    };

    this.updateData({
      variables: [...this.data.variables, newVariable],
      segments: [...this.data.segments, newSegment],
    });
  }

  removeSegment(segmentIndex: number): void {
    const segment = this.data.segments[segmentIndex];
    const newSegments = this.data.segments.filter((_, i) => i !== segmentIndex);

    let newVariables = this.data.variables;
    if (segment.type === 'variable') {
      newVariables = this.data.variables.filter((v) => v.id !== segment.content);
    }

    this.updateData({
      segments: newSegments,
      variables: newVariables,
    });
  }

  moveSegment(fromIndex: number, toIndex: number): void {
    const newSegments = [...this.data.segments];
    const [movedSegment] = newSegments.splice(fromIndex, 1);
    newSegments.splice(toIndex, 0, movedSegment);
    this.updateData({ segments: newSegments });
  }

  updateVariable(variableId: string, updates: Partial<(typeof this.data.variables)[0]>): void {
    const newVariables = this.data.variables.map((v) =>
      v.id === variableId ? { ...v, ...updates } : v,
    );
    this.updateData({ variables: newVariables });
  }

  getAvailableParticipants(excludeVariableIndex?: number): ParticipantSummary[] {
    return this.participants.filter((p) => {
      const isAlreadyAssigned = this.data.variables.some(
        (v, vIndex) => vIndex !== excludeVariableIndex && v.assigned_user_id === p.user_id,
      );
      return !isAlreadyAssigned;
    });
  }
}
