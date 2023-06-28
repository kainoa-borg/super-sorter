import Image from 'next/image' 
import { Inter } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactEventHandler, useEffect, useState } from 'react'
import React from 'react'
import { randomInt } from 'crypto'
import {shuffle} from 'lodash'
import useSound from 'use-sound'
import { list } from 'postcss'

const inter = Inter({ subsets: ['latin'] })

// Helper Variables
var timeouts:Array<any> = []

// Helper Functions

const clearTimeouts = () => {
  timeouts.forEach((timeout) => {
    clearTimeout(timeout)
  })
}

async function sleep(ms:number) {
  return new Promise((res) => {
    timeouts.push(setTimeout(res, ms));
  })
}

const swapIndices = (listToSwap:Array<number>, a:number, b:number):Array<number> => {
  let newList = [...listToSwap];
  let temp = newList[a];
  newList[a] = newList[b];
  newList[b] = temp;

  return newList;
}

const bubbleSort = async (listToSort:Array<number>, setListToSort:any, n:number, setSelectedKey:any, delay:number, sfx:any) => {
  let swapped:boolean = false;
  for (let i = 1; i < n; i++) {
      setSelectedKey([i, i-1])
      if (listToSort[i] < listToSort[i-1]) {
        listToSort = swapIndices(listToSort, i, i-1)
        setListToSort(listToSort);
        swapped = true;
      }
      await sleep(delay);
      sfx();
  }
    if (swapped) 
      bubbleSort(listToSort, setListToSort, n, setSelectedKey, delay, sfx);
    else {
      await sleep(250);
      for (let i = 0; i < n; i++) {
        setSelectedKey([-1, i]);
        sfx();
        await sleep(delay*2);
      }
    }
}

const selectionSort = async (listToSort:Array<number>, setListToSort:any, n:number, setSelectedKey:any, delay:number, sfx:any) => {
  for (let i = 0; i < n; i++) {
    let min = i;
    for (let j = i; j < n; j++) {
          setSelectedKey([i, j])
          if (listToSort[j] < listToSort[min]) {
            min = j;
          }
          await sleep(delay)
          sfx();
    }
    if (min != i) {
      listToSort = swapIndices(listToSort, i, min);
      setListToSort(listToSort);
    }        
  }
  await sleep(250);
  for (let i = 0; i < n; i++) {
    setSelectedKey([-1, i]);
    sfx();
    await sleep(delay*2);
  }
}

const merge = async (sortedList:Array<number>, setListToSort:any, setSelectedKey:any, l:number, m:number, r:number, delay:number, sfx:any) => {
  let i = 0, j = 0, k = l;
  let n1 = m - l + 1;
  let n2 = r - m;
  let L:Array<number> = []
  let R:Array<number> = []
  for (let x = 0; x < n1; x++) {
    L[x] = sortedList[l + x];
  }
  for (let y = 0; y < n2; y++) {
    R[y] = sortedList[m + 1 + y];
  }
  while(i < n1 && j < n2) {
    if (L[i] <= R[j]) {
      sortedList[k] = L[i];
      i += 1;
    }
    else {
      sortedList[k] = R[j];
      j += 1;
    }
    setSelectedKey([-1, k])
    sfx();
    await sleep (delay);
    setListToSort(sortedList);
    k += 1
  }

  while(i < n1) {
    sortedList[k] = L[i];
    setSelectedKey([-1, k]);
    sfx();
    await sleep (delay);
    setListToSort(sortedList);
    i += 1;
    k += 1;
  }
  while(j < n2) {
    sortedList[k] = R[j];
    setSelectedKey([-1, k])
    sfx();
    await sleep (delay);
    setListToSort(sortedList);
    j += 1;
    k += 1
  }
}

const mergeSortRecursive = async (sortedList:Array<number>, setListToSort:any, setSelectedKey:any, l:number, r:number, delay:number, sfx:any) => {
  if (l < r) {
    let m = l + Math.floor((r - l) / 2);

    await mergeSortRecursive(sortedList, setListToSort, setSelectedKey, l, m, delay, sfx);
    await mergeSortRecursive(sortedList, setListToSort, setSelectedKey, m + 1, r, delay, sfx);

    await merge(sortedList, setListToSort, setSelectedKey, l, m, r, delay, sfx)
  }
}

const mergeSort = async (listToSort:Array<number>, setListToSort:any, setSelectedKey:any, n:any, delay:number, sfx:any) => {
  console.log('beginning');
  let sortedList = [...listToSort];
  await mergeSortRecursive(sortedList, setListToSort, setSelectedKey, 0, n, delay, sfx)
  setListToSort(sortedList.slice(1, n))
  await sleep(250);
  for (let i = 0; i < n; i++) {
    setSelectedKey([-1, i]);
    sfx();
    await sleep(delay*2);
  }
}

const randomIntList = (n:number, max:number=1000):Array<number> => {
  let list = []
  for (let i = 1; i < n + 1; i++) {
    list.push(i);
  }
  return list;
}

// Data
const unselected = {
  backgroundColor: '#64748B'
}
const selected = {
  backgroundColor: '#3bc46f'
}

// Components
const Cell = (props:any) => {
  return (
    <motion.div key={props.num}
      layout
      transition={{layout: {type: 'just', stiffness: 50, duration: 0.1}, backgroundColor: {type: 'just', duration: 0.001}}}
      className='bg-slate-500 grow border-white border-x h-10'
      style={{height: (props.windowHeight * .6) * (props.num / props.max)}}
      variants={{unselected, selected}}
      animate={props.isSelected ? selected : unselected}
    >
    </motion.div>
  )
}

const ColumnCellContainer = (props:any) => {
  return (
    <div className='flex absolute bottom-0 items-end w-[100vw]'>
      {/* <AnimatePresence> */}
        {props.cellList}
      {/* </AnimatePresence> */}
    </div>
  )
}

// Main
export default function Home() {

  const [isVisible, setVisible] = useState(false);
  const [scaleTest, setScaleTest] = useState(false);
  const [listLen, setListLen] = useState(20); 
  const [intList, setIntList] = useState(shuffle(randomIntList(listLen)));
  const [selectedKey, setSelectedKey] = useState([-1, -1]);
  const [delay, setDelay] = useState(10);
  const [playbackRate, setPlaybackRate] = useState(0.1)
  const [windowHeight, setWindowHeight] = useState(0);

  const [cellList, setCellList] = useState(intList.map((num, key) => {return (<Cell isSelected={selectedKey[0] == key || selectedKey[1] == key ? true : false} thisKey={key} key={num} num={num} max={listLen} windowHeight={windowHeight}/>)}))

  const [playPipe] = useSound('./sfx/fart-small.mp3', {volume: 0.5, playbackRate});
  const [playFart] = useSound('./sfx/pop.mp3', {volume: 0.5, playbackRate});

  useEffect(() => {
    setCellList(intList.map((num, key) => <Cell isSelected={selectedKey[0] == key || selectedKey[1] == key ? true : false} key={num} thisKey={key} num={num} max={listLen} windowHeight={windowHeight}/>))
  }, [intList, selectedKey])

  useEffect(() => {
    clearTimeouts();
    setSelectedKey([-1, -1]);
    setIntList(randomIntList(listLen));
  }, [listLen, delay])

  useEffect(() => {
    setPlaybackRate(((typeof(intList[selectedKey[1]])=='number' ? intList[selectedKey[1]]/listLen : 1) + .01))
  }, [selectedKey[1]])

  useEffect(() => {
    setWindowHeight(window.innerHeight);
  }, [])

  return (
    <main>
      <div className='bg-container'>
        <div className='flex md:space-x-2 flex-wrap basis-full md:w-[65vw] w-[100%] mb-2'>
          <button 
            onClick={() => {
              clearTimeouts(); 
              setSelectedKey([-1, -1]); 
              setIntList(shuffle(randomIntList(listLen)))}
            } 
            className='myButton grow'
          >
            Shuffle
          </button>
          
          <button 
            onClick={() => {
              clearTimeouts(); 
              setSelectedKey([-1, -1]); 
              bubbleSort(intList, setIntList, listLen, setSelectedKey, delay, playFart)}
              } 
            className='myButton grow'
          >
              Bubble Sort
          </button>
          
          <button 
            onClick={() => {
              clearTimeouts(); 
              setSelectedKey([-1, -1]); 
              selectionSort(intList, setIntList, listLen, setSelectedKey, delay, playFart)}
            } 
            className='myButton grow'
          >
            Selection Sort
          </button>
          
          <button 
            onClick={() => {
              clearTimeouts(); 
              setSelectedKey([-1, -1]); 
              mergeSort(intList, setIntList, setSelectedKey, listLen, delay, playFart)}
            } 
              className='myButton grow'
          >
            Merge Sort
          </button>
          
          <button onClick={() => {playFart()}} className='myButton grow'>Test Sound</button>
        
        </div>
        <div className='flex md:space-x-2 flex-wrap md:w-[65vw] w-[100%]'>

          <label className='myButton md:w-auto w-[50%] grow'>Delay (ms):</label>
          <input className='p-3 md:w-auto w-[50%] grow' value={delay} type='number' min={5} max={10000} onChange={
            (event) => setDelay(Number(event.target.value))
          }></input>
          
          <label className='myButton md:w-auto w-[50%] grow'>Num columns:</label>
          <input className='p-3 md:w-auto w-[50%] grow' value={listLen} type='number' min={5} max={200} onChange={
            (event) => setListLen(Number(event.target.value))
          }></input>

        </div>
        <ColumnCellContainer cellList={cellList}/>
      </div>
    </main>
  )
}
