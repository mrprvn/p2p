"use client"

import React, { useState } from 'react'

const ChatForm = ({onSendMessage}: {onSendMessage: (message: string) => void}) => {

    const [message, setMessage] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(message.trim() !== "") {
            onSendMessage(message);
            setMessage("");
        }
    }
  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-4 mt-4'>
        <input type="text" onChange={(e) => setMessage(e.target.value) } className='flex-1 px-4 border-2 py-2 rounded-lg focus:outline-none' placeholder="Enter your message..." />
        <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer rounded-lg'>Send</button>
    </form>
  )
}

export default ChatForm