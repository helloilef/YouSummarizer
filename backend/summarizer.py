from langchain.chains.summarize import load_summarize_chain
from langchain_community.llms.together import Together
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
from langchain.chains.summarize import load_summarize_chain
from langchain.schema import Document
import math

from langchain.prompts import PromptTemplate

bullet_prompt = PromptTemplate.from_template("""
Write a detailed summary of the following transcript. 
- Write a paragraph that captures the essence of the content.
- Make the summary at least 10 bullet points.
- Each bullet point should capture a key idea, fact, or actionable insight.
- Use clear, concise language.
- If possible, group related points together.

{text}
""")
def adaptive_summarize(llm, full_transcript: str, video_duration_minutes: int) -> str:
    """
    Summarizes a YouTube transcript based on the video duration.
    - ≤ 30 min: summarize whole transcript in one go.
    - > 30 and ≤ 60 min: split in 2, summarize, then combine.
    - > 60 min: proportional chunking (2 chunks per hour).
    """
    # Convert transcript string to a LangChain Document
    full_doc = Document(page_content=full_transcript)

    if video_duration_minutes <= 30:
        print("▶ Summarizing without chunking (≤ 30 min)")
        chain = load_summarize_chain(
            llm, 
            chain_type="stuff", 
            verbose=True, 
            prompt=bullet_prompt
        )
        return chain.run([full_doc])
    
    elif video_duration_minutes <= 60:
        print("▶ Summarizing with 2 chunks (30–60 min)")
        mid_point = len(full_transcript) // 2
        chunks = [
            Document(page_content=full_transcript[:mid_point]),
            Document(page_content=full_transcript[mid_point:])
        ]
        chain = load_summarize_chain(
            llm, 
            chain_type="map_reduce", 
            verbose=True, 
            prompt=bullet_prompt
        )
        return chain.run(chunks)
    
    else:
        print("▶ Summarizing with proportional chunking (> 60 min)")
        # Calculate number of chunks = 2 × hours
        num_chunks = int(math.ceil(2 * (video_duration_minutes / 60)))
        chunk_size = len(full_transcript) // num_chunks
        chunks = [
            Document(page_content=full_transcript[i * chunk_size: (i + 1) * chunk_size])
            for i in range(num_chunks)
        ]
        chain = load_summarize_chain(
            llm, 
            chain_type="stuff", 
            verbose=True, 
            prompt=bullet_prompt
        )
        return chain.run(chunks)


def get_llm():
    return Together(
        model="mistralai/Mistral-7B-Instruct-v0.1",
        temperature=0.7,
        max_tokens=1024
    )

def load_vectorstore(persist_directory="chroma_db"):
    return Chroma(
        embedding_function=embedding_model,
        persist_directory=persist_directory
    )

def summarize_with_map_reduce(llm, docs):
    chain = load_summarize_chain(llm, chain_type="map_reduce", verbose=True)
    return chain.run(docs)
