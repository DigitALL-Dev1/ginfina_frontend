import { SimpleGrid } from '@mantine/core';
import { useState } from 'react';
import FieldControl from './FieldControl';
export default function ScreenForm({ fields = [] }) {
  const [values, setValues] = useState({});
  return <SimpleGrid cols={{ base:1, sm:2 }} spacing="md">{fields.map((row) => <FieldControl key={`${row[0]}-${row[1]}`} row={row} value={values[row[1]]} onChange={(next)=>setValues((current)=>({...current,[row[1]]:next}))}/>)}</SimpleGrid>;
}
