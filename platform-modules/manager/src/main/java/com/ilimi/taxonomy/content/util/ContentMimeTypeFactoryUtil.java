package com.ilimi.taxonomy.content.util;

import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.ilimi.common.dto.CoverageIgnore;
import com.ilimi.taxonomy.mgr.IMimeTypeManager;
import com.ilimi.taxonomy.mgr.impl.APKMimeTypeMgrImpl;
import com.ilimi.taxonomy.mgr.impl.CollectionMimeTypeMgrImpl;
import com.ilimi.taxonomy.mgr.impl.ECMLMimeTypeMgrImpl;
import com.ilimi.taxonomy.mgr.impl.HTMLMimeTypeMgrImpl;
import com.ilimi.taxonomy.mgr.impl.PluginMimeTypeMgrImpl;
import com.ilimi.taxonomy.mgr.impl.AssetsMimeTypeMgrImpl;

public class ContentMimeTypeFactoryUtil {

	/** The logger. */
	private static Logger LOGGER = LogManager.getLogger(ContentMimeTypeFactoryUtil.class.getName());

	static IMimeTypeManager ecmlMimeTypeMgr = new ECMLMimeTypeMgrImpl();
	static IMimeTypeManager htmlMimeTypeMgr = new HTMLMimeTypeMgrImpl();
	static IMimeTypeManager apkMimeTypeMgr = new APKMimeTypeMgrImpl();
	static IMimeTypeManager collectionMimeTypeMgr = new CollectionMimeTypeMgrImpl();
	static IMimeTypeManager assetsMimeTypeMgr = new AssetsMimeTypeMgrImpl();
	static IMimeTypeManager pluginMimeTypeMgrImpl = new PluginMimeTypeMgrImpl();

	@CoverageIgnore
    public static IMimeTypeManager getImplForService(String mimeType){
    	IMimeTypeManager manager = assetsMimeTypeMgr;
    	switch (StringUtils.lowerCase(mimeType)) {
			case "application/vnd.ekstep.ecml-archive":
				manager = ecmlMimeTypeMgr;
				break;
			case "application/vnd.ekstep.html-archive":
				manager = htmlMimeTypeMgr;
				break;
			case "application/vnd.android.package-archive":
				manager = apkMimeTypeMgr;
				break;
			case "application/vnd.ekstep.content-collection":
				manager = collectionMimeTypeMgr;
				break;
			case "assets":
				manager = assetsMimeTypeMgr;
				break;
			case "application/vnd.ekstep.plugin-archive":
				manager = pluginMimeTypeMgrImpl;
				break;
			default:
				manager = assetsMimeTypeMgr;
				break;
		}
       return manager;
    }
}