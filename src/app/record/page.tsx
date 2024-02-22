'use client';

import axios from 'axios';
import { useState, useRef } from 'react';

export default function AudioRecord() {
  const [mediaRecorder, setMediaRecorder] = useState<any>(null);
  const [blob, setBlob] = useState<any>(null);
  const [resultText, setResultText] = useState<string>('');

  const audioRef = useRef<any>();
  const chunks: any = [];

  const onRecAudio = async () => {
    try {
      // MediaRecorder 객체 생성, 마이크 mediaStream을 인자로 전달
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true }); // 마이크 mediaStream 생성(접근 권한), Promise를 반환
      const createMediaRecorder = new MediaRecorder(mediaStream);
      setMediaRecorder(createMediaRecorder);

      // 오디오 데이터(Blob)가 들어올 때마다 오디오 데이터 조각들을 chunks 배열에 담는 이벤트 핸들러 등록
      createMediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      // 녹음 종료 시 배열에 담긴 오디오 데이터(Blob)들을 합치는 이벤트 핸들러 등록 + 코덱 설정
      createMediaRecorder.onstop = () => {
        const createBlob = new Blob(chunks, { type: 'audio/*' });
        setBlob(createBlob);
        chunks.splice(0); // 통합 Blob 객체를 생성한 후 기존 오디오 데이터 배열 초기화
        const audioURL = window.URL.createObjectURL(createBlob); // Blob 데이터에 접근할 수 있는 객체 URL을 생성
        audioRef.current.src = audioURL;
      };

      createMediaRecorder.start();
    } catch (error) {
      console.error('마이크 사용을 허용해주세요.');
    }
  };

  const offRecAudio = () => {
    mediaRecorder.stop();
  };

  const submitAndTranscribeAudio = async () => {
    const formData = new FormData();
    formData.append('audio_file', blob);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/transcribe/`, formData);
      console.log(res);
      const { status, data } = res;
      if (status === 200) {
        setResultText(data.text);
      } else {
        throw new Error('something was wrong!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className='flex gap-x-[20px]'>
        <button type='button' className='bg-red-500' onClick={onRecAudio}>
          녹음 시작
        </button>

        <button type='button' className='bg-blue-500' onClick={offRecAudio}>
          녹음 종료
        </button>

        <button className='bg-teal-900 text-white' onClick={submitAndTranscribeAudio}>
          녹음 파일 변환
        </button>
      </div>
      <audio controls ref={audioRef} />
      <div>{resultText}</div>
    </div>
  );
}
