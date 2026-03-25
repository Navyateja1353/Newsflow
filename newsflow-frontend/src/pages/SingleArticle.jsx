import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function SingleArticle() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
      const element = document.getElementById('article-print-container');
      if (!element) return;
      
      setPdfLoading(true);
      try {
          const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          // Width of a standard A4 page in mm
          const pdfWidth = 210;
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          // Calculate exact height necessary to keep the entire document seamlessly on 1 page
          const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;
          
          // Create custom sized PDF document that is exactly 1 continuous page long
          const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${article.headline.substring(0, 30)}.pdf`);
      } catch (err) {
          console.error("PDF generation failed", err);
          alert("Failed to generate PDF.");
      } finally {
          setPdfLoading(false);
      }
  };

  // The today date in English standard to match the reference
  const todayString = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    // Fetch Global Logo
    axios.get("http://localhost:3000/api/settings/logo")
      .then(res => {
          if (res.data && res.data.value && res.data.value !== 'null') {
              setLogoUrl(res.data.value);
          }
      })
      .catch(err => console.error("Error fetching logo", err));

    // Fetch Article
    axios.get(`http://localhost:3000/api/public/article/${id}`)
      .then(res => {
        setArticle(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching article", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{textAlign: "center", padding: "50px", fontFamily: "sans-serif"}}>లోడ్ అవుతోంది...</div>;
  if (!article) return <div style={{textAlign: "center", padding: "50px", fontFamily: "sans-serif"}}>వార్త కనుగొనబడలేదు (Article Not Found)</div>;

  const logoSrc = logoUrl 
    ? (logoUrl.startsWith('http') 
        ? logoUrl 
        : (logoUrl.startsWith('/logos/') 
            ? logoUrl 
            : `http://localhost:3000${logoUrl}`)) 
    : null;
  const imageSrc = article.image_url ? (article.image_url.startsWith('http') ? article.image_url : `http://localhost:3000${article.image_url}`) : null;

  return (
    <div style={{ backgroundColor: "#f4f4f4", minHeight: "100vh", padding: "20px 10px" }}>
        {/* Print Action Bar */}
        <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "15px", textAlign: "right" }}>
            <button 
                onClick={handleDownloadPDF} 
                disabled={pdfLoading}
                style={{ 
                    backgroundColor: "#004080", 
                    color: "#fff", 
                    border: "none", 
                    padding: "10px 20px", 
                    borderRadius: "5px", 
                    cursor: "pointer", 
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    opacity: pdfLoading ? 0.7 : 1
                }}
            >
                {pdfLoading ? "Generating PDF..." : "🖨️ Download PDF"}
            </button>
        </div>

        <div id="article-print-container" style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", boxShadow: "0 0 10px rgba(0,0,0,0.1)", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            
            {/* Header (Logo Filling Full Width, No Extra Text) */}
            <div style={{ textAlign: "center", borderBottom: "3px solid #ccc" }}>
                {logoSrc ? (
                    <img src={logoSrc} alt="Newspaper Logo" style={{ width: "100%", height: "auto", display: "block" }} />
                ) : (
                    <div style={{ border: "2px solid #8B008B", padding: "15px", backgroundColor: "#fff" }}>
                        <span style={{ fontSize: "52px", fontWeight: "900", color: "#8B008B", letterSpacing: "1px", textTransform: "uppercase" }}>RTI EXPRESS</span>
                    </div>
                )}
            </div>

            {/* Headline Section */}
            <div style={{ padding: "20px" }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <h1 style={{ color: "#e60000", fontSize: "48px", fontWeight: "900", margin: "0 0 15px 0", lineHeight: "1.2", textShadow: "1px 1px 0 #fff" }}>
                        {article.headline}
                    </h1>
                    
                    {/* Blue Ribbon Sub headline/Category */}
                    <div style={{ backgroundColor: "#004080", color: "white", padding: "8px 25px", borderRadius: "20px", display: "inline-block", fontSize: "16px", fontWeight: "700" }}>
                        {article.category || "తాజా వార్తలు"}
                    </div>
                </div>

                {/* Article Content & Image */}
                <div>
                    {imageSrc && (
                        <div style={{ width: "100%", marginBottom: "20px" }}>
                            <img src={imageSrc} style={{ width: "100%", height: "auto", border: "1px solid #e0e0e0" }} alt="Article Visual" />
                        </div>
                    )}
                    
                    <div style={{ fontSize: "18px", lineHeight: "1.8", color: "#111", padding: "10px" }}>
                        {article.content.split('\n').map((paragraph, index) => (
                            <p key={index} style={{ marginBottom: "15px", whiteSpace: "pre-wrap", textAlign: "justify" }}>
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Spacer/Footer for visual balance */}
            <div style={{ height: "40px", backgroundColor: "#f9f9f9", borderTop: "1px solid #eee" }}></div>
        </div>
    </div>
  );
}

export default SingleArticle;
