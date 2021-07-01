import { readable, writable } from 'svelte/store';
import { ASSIGNMENTS } from '../constants';

// writeable
export const sessionKey = writable(null);

// static
const getAssignmentsSelect = (type = 'text') => {
  // start with unassigned
  const selectArray = [{
    value: ASSIGNMENTS.unassigned.id,
    text: 'Not assigned',
    disabled: false,
  }];

  // iterate ASSIGNMENTS and pull out the corresponding types
  Object.keys(ASSIGNMENTS).forEach((key) => {
    if (ASSIGNMENTS[key].nodeType === type) {
      const selectEntry = {
        value: ASSIGNMENTS[key].id,
        text: ASSIGNMENTS[key].text,
        disabled: false,
      };
      selectArray.push(selectEntry);
    }
  });
  return selectArray;
};
export const shapeAssignmentsSelect = readable(getAssignmentsSelect('shape'));
export const textAssignmentsSelect = readable(getAssignmentsSelect('text'));
